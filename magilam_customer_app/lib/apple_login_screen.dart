import 'package:flutter/material.dart';
import 'theme.dart';

class AppleLoginScreen extends StatelessWidget {
  const AppleLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,
      appBar: AppBar(
        title: const Text("Apple Login"),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: const Center(
        child: Text(
          "Apple Authentication Page",
          style: TextStyle(fontSize: 20),
        ),
      ),
    );
  }
}
