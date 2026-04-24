import 'package:flutter/material.dart';
import '../theme.dart';

class SuccessScreen extends StatelessWidget {
  const SuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: AppColors.sandalBackground,

      appBar: AppBar(
        title: const Text("Order Success"),
        backgroundColor: AppColors.mossGreen,
        automaticallyImplyLeading: false,
      ),

      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [

            // 🔥 LOGO
            Image.asset(
              'assets/logo.png',
              height: 90,
            ),

            const SizedBox(height: 20),

            const Icon(
              Icons.check_circle,
              size: 120,
              color: Colors.green,
            ),

            const SizedBox(height: 20),

            const Text(
              "Order Placed Successfully!",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 10),

            const Text("Your food is on the way 🚀"),

            const SizedBox(height: 30),

            ElevatedButton(
              onPressed: () {
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/menu',
                  (route) => false,
                );
              },
              child: const Text("Back to Menu"),
            ),
          ],
        ),
      ),
    );
  }
}