import 'package:flutter/material.dart';
import '../theme.dart';

class GoogleLoginScreen extends StatelessWidget {
  const GoogleLoginScreen({super.key});

  void _loginWithGoogle(BuildContext context) {
    // 👉 For now just navigate (you can add real Google auth later)
    Navigator.pushReplacementNamed(context, '/main');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,

      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [

            // 🔥 TITLE
            const Text(
              "Login with Google",
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 40),

            // 🔥 GOOGLE BUTTON
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              onPressed: () => _loginWithGoogle(context),
              icon: const Icon(Icons.g_mobiledata, size: 30),
              label: const Text("Continue with Google"),
            ),

            const SizedBox(height: 20),

            // 🔥 BACK TO LOGIN
            TextButton(
              onPressed: () {
                Navigator.pushNamed(context, '/login');
              },
              child: const Text("Back to Login"),
            )
          ],
        ),
      ),
    );
  }
}