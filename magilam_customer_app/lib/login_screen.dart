import 'package:flutter/material.dart';
import 'theme.dart';
import 'register_screen.dart';
import 'google_login_screen.dart';
import 'apple_login_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _buttonController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    _buttonController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.95,
      upperBound: 1.0,
    )..forward();

    _scaleAnimation = _buttonController;
  }

  void _onTapDown(_) => _buttonController.reverse();
  void _onTapUp(_) => _buttonController.forward();

  @override
  void dispose() {
    _buttonController.dispose();
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

          double formWidth;
          if (screenWidth < 400) {
            formWidth = screenWidth * 0.92;
          } else if (screenWidth < 900) {
            formWidth = 420;
          } else {
            formWidth = 450;
          }

          return Center(
            child: SingleChildScrollView(
              child: SizedBox(
                width: formWidth,
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    vertical: screenHeight * 0.05,
                  ),
                  child: Column(
                    children: [

                      Image.asset(
                        "assets/logo.png",
                        width: formWidth * 0.6,
                      ),
                      const SizedBox(height: 40),

                      _buildTextField("Email"),
                      const SizedBox(height: 20),

                      _buildTextField("Password", isPassword: true),
                      const SizedBox(height: 8),

                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {},
                          child: const Text(
                            "Forgot Password?",
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 15),

                      GestureDetector(
                        onTapDown: _onTapDown,
                        onTapUp: _onTapUp,
                        onTapCancel: () => _buttonController.forward(),
                        child: ScaleTransition(
                          scale: _scaleAnimation,
                          child: SizedBox(
                            width: double.infinity,
                            height: 55,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.mossGreen,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                              ),
                              onPressed: () {},
                              child: const Text(
                                "LOGIN",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 30),

                      Row(
                        children: [
                          Expanded(child: Divider()),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 10),
                            child: Text("OR"),
                          ),
                          Expanded(child: Divider()),
                        ],
                      ),

                      const SizedBox(height: 25),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _socialButton("assets/google.png", () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => GoogleLoginScreen(),
                              ),
                            );
                          }),
                          const SizedBox(width: 30),
                          _socialButton("assets/apple.png", () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => AppleLoginScreen(),
                              ),
                            );
                          }),
                        ],
                      ),

                      const SizedBox(height: 25),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text("Don’t have an account? "),
                          GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => RegisterScreen(),
                                ),
                              );
                            },
                            child: const Text(
                              "Register Now",
                              style: TextStyle(
                                color: AppColors.mossGreen,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTextField(String hint, {bool isPassword = false}) {
    return TextField(
      obscureText: isPassword,
      decoration: InputDecoration(
        hintText: hint,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: const BorderSide(color: Colors.grey),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide:
              const BorderSide(color: AppColors.orangeAccent, width: 2),
        ),
      ),
    );
  }

  Widget _socialButton(String assetPath, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(50),
      child: Container(
        height: 55,
        width: 55,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.mossGreen),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Image.asset(assetPath),
        ),
      ),
    );
  }
}
