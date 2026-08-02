import 'dart:async';
import 'dart:math';

class PaymentResult {
  final bool success;
  final String message;
  final String? transactionId;

  final String? invoiceId;
  final double? amount;

  PaymentResult({
    required this.success,
    required this.message,
    this.transactionId,
    this.invoiceId,
    this.amount,
  });
}
class MockPaymentService {
  Future<PaymentResult> processPayment(double amount) async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 2));

    // Mock success/fail (80% success rate)
    final isSuccess = Random().nextDouble() < 0.8;

    if (isSuccess) {
      return PaymentResult(
        success: true,
        message: 'Payment of ₹${amount.toStringAsFixed(2)} successful!',
        transactionId: 'TXN-${DateTime.now().millisecondsSinceEpoch}',
      );
    } else {
      return PaymentResult(
        success: false,
        message: 'Payment failed. Please check your card details and try again.',
      );
    }
  }
}
