import 'dart:convert';

import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'theme.dart';

class UpiPaymentScreen extends StatefulWidget {
  final String invoiceId;
  final double amount;

  const UpiPaymentScreen({
    Key? key,
    required this.invoiceId,
    required this.amount,
  }) : super(key: key);

  @override
  State<UpiPaymentScreen> createState() => _UpiPaymentScreenState();
}

class _UpiPaymentScreenState extends State<UpiPaymentScreen> {
  final ApiService api = ApiService();
  final TextEditingController transactionController = TextEditingController();

  String? qrData; // raw base64 string (without data-URL prefix)
  bool loading = true;
  bool submitting = false;
  String? loadError;

  @override
  void initState() {
    super.initState();
    _loadQR();
  }

  @override
  void dispose() {
    transactionController.dispose();
    super.dispose();
  }

  Future<void> _loadQR() async {
    setState(() {
      loading = true;
      loadError = null;
    });
    try {
      final response = await api.getInvoiceQr(widget.invoiceId);
      String? raw;

      // The backend may return either:
      //   { "qr_data_url": "data:image/png;base64,..." }  OR
      //   { "qr_data_url": "<raw base64 string>" }
      if (response['data'] != null && response['data']['qr_data_url'] != null) {
        raw = response['data']['qr_data_url'].toString();
      } else if (response['qr_data_url'] != null) {
        raw = response['qr_data_url'].toString();
      }

      if (raw != null && raw.isNotEmpty) {
        // Strip the data-URL prefix if present
        if (raw.contains(',')) {
          raw = raw.split(',').last;
        }
        setState(() {
          qrData = raw;
          loading = false;
        });
      } else {
        setState(() {
          loadError = 'QR code not available. Please try again.';
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        loadError = 'Failed to load QR: ${e.toString()}';
        loading = false;
      });
    }
  }

  Future<void> _submit() async {
    final utr = transactionController.text.trim();
    if (utr.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your Transaction ID / UTR Number'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => submitting = true);

    try {
      await api.submitPayment(
        invoiceId: widget.invoiceId,
        paymentType: 'full',
        amount: widget.amount,
        transactionId: utr,
      );

      if (!mounted) return;

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 28),
              const SizedBox(width: 8),
              const Text('Payment Submitted'),
            ],
          ),
          content: const Text(
            'Your payment details have been submitted.\n\nThe merchant will verify your UTR and confirm the payment shortly.',
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // close dialog
                Navigator.pop(context); // back to order detail
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.mossGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Done'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Submission failed: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,
      appBar: AppBar(
        title: const Text('UPI Payment'),
        backgroundColor: AppColors.mossGreen,
        foregroundColor: Colors.white,
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : loadError != null
              ? _buildErrorState()
              : _buildPaymentContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.qr_code_2, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              loadError!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Colors.black54),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadQR,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.mossGreen,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Amount card
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.currency_rupee, size: 28, color: AppColors.mossGreen),
                  Text(
                    widget.amount.toStringAsFixed(2),
                    style: const TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                      color: AppColors.mossGreen,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Step 1 — Scan QR
          _buildStepLabel('Step 1 — Scan with GPay / PhonePe / Any UPI App'),
          const SizedBox(height: 12),

          if (qrData != null)
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.memory(
                    base64Decode(qrData!),
                    width: 250,
                    height: 250,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Padding(
                      padding: EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Icon(Icons.broken_image, size: 60, color: Colors.grey),
                          SizedBox(height: 8),
                          Text('Could not decode QR image', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

          const SizedBox(height: 28),

          // Step 2 — Enter UTR
          _buildStepLabel('Step 2 — Enter Transaction ID / UTR after paying'),
          const SizedBox(height: 12),

          TextField(
            controller: transactionController,
            keyboardType: TextInputType.text,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(
              hintText: 'e.g. 426123456789',
              labelText: 'Transaction ID / UTR Number',
              prefixIcon: const Icon(Icons.tag),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.mossGreen, width: 2),
              ),
            ),
          ),

          const SizedBox(height: 12),

          const Text(
            'You can find the UTR / Transaction ID in your UPI app under payment history.',
            style: TextStyle(fontSize: 12, color: Colors.black54),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 28),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: submitting ? null : _submit,
              icon: submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
              label: Text(submitting ? 'Submitting...' : 'Submit Payment'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.mossGreen,
                foregroundColor: Colors.white,
                textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStepLabel(String text) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
          color: Colors.black87,
        ),
      ),
    );
  }
}