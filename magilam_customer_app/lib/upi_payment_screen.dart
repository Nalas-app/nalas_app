import 'dart:convert';

import 'package:flutter/material.dart';
import 'services/api_service.dart';

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

  final TextEditingController transactionController =
      TextEditingController();

  String? qrData;

  bool loading = true;

  bool submitting = false;

  @override
  void initState() {
    super.initState();
    loadQR();
  }

  Future<void> loadQR() async {
    try {
      final response =
          await api.getInvoiceQr(widget.invoiceId);

      qrData = response["qr_data_url"];
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }

    setState(() {
      loading = false;
    });
  }

  Future<void> submit() async {
    if (transactionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Enter Transaction ID"),
        ),
      );
      return;
    }

    setState(() {
      submitting = true;
    });

    try {
      await api.submitPayment(
        invoiceId: widget.invoiceId,
        paymentType: "full",
        amount: widget.amount,
        transactionId: transactionController.text.trim(),
      );

      if (!mounted) return;

      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Payment Submitted"),
          content: const Text(
            "Your payment has been submitted successfully.\nThe merchant will verify it shortly.",
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              child: const Text("OK"),
            )
          ],
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }

    setState(() {
      submitting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("UPI Payment"),
      ),
      body: loading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [

                  Text(
                    "Amount : ₹${widget.amount}",
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 25),

                  if (qrData != null)
                    Image.memory(
                      base64Decode(qrData!),
                      width: 250,
                      height: 250,
                    ),

                  const SizedBox(height: 30),

                  TextField(
                    controller: transactionController,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: "Transaction ID / UTR",
                    ),
                  ),

                  const SizedBox(height: 30),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed:
                          submitting ? null : submit,
                      child: submitting
                          ? const CircularProgressIndicator()
                          : const Text("Submit Payment"),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}