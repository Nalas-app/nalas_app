import 'dart:async';
import 'package:flutter/material.dart';
import 'login_screen.dart';
import 'theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    _controller =
        AnimationController(vsync: this, duration: const Duration(seconds: 1));

    _scaleAnimation =
        CurvedAnimation(parent: _controller, curve: Curves.easeOutBack);

    _controller.forward();

    // 4 seconds splash duration
    Timer(const Duration(seconds: 4), () {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,
      body: LayoutBuilder(
        builder: (context, constraints) {
          double screenWidth = constraints.maxWidth;
          double screenHeight = constraints.maxHeight;

          // Responsive logo scaling
          double logoWidth;

          if (screenWidth < 400) {
            logoWidth = screenWidth * 0.7; // small phones
          } else if (screenWidth < 800) {
            logoWidth = screenWidth * 0.5; // normal phones & tablets
          } else {
            logoWidth = 350; // laptops/web
          }

          return Column(
            children: [
              const Spacer(),

              // Centered Logo
              Center(
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Image.asset(
                    "assets/logo.png",
                    width: logoWidth,
                  ),
                ),
              ),

              const Spacer(),

              // NRC Branding Bottom Center
              Padding(
                padding: EdgeInsets.only(
                  bottom: screenHeight * 0.04,
                ),
                child: const Text(
                  "Part of NRC Group",
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textDark,
                  ),
                ),
              )
            ],
          );
        },
      ),
    );
  }
}
