import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

   @override
  void initState() {
    super.initState();

    Future.delayed(const Duration(seconds: 2), () async {
      final authProvider = context.read<AuthProvider>();
      final isLoggedIn = await authProvider.tryAutoLogin();
      
      if (!mounted) return;

      if (isLoggedIn) {
        Navigator.pushReplacementNamed(context, '/menu');
      } else {
        Navigator.pushReplacementNamed(context, '/login');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Image.asset("assets/logo.png", width: 150),
      ),
    );
  }
}