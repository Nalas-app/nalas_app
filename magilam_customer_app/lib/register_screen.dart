import 'package:flutter/material.dart';
import 'theme.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textDark),
      ),
      body: const Center(
        child: Text(
          "Register Screen",
          style: TextStyle(fontSize: 22),
        ),
      ),
    );
  }
}
