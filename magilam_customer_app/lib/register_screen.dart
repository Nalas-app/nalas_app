import 'package:flutter/material.dart';
import 'theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {

  final _formKey = GlobalKey<FormState>();

  final TextEditingController _passwordController =
      TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;

  void _register() {
    if (_formKey.currentState!.validate()) {
      if (_passwordController.text !=
          _confirmPasswordController.text) {

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Passwords do not match"),
            backgroundColor: Colors.red,
          ),
        );

        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Registration Successful"),
        ),
      );

      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,
      body: LayoutBuilder(
        builder: (context, constraints) {

          double width = constraints.maxWidth;

          double formWidth;
          if (width < 400) {
            formWidth = width * 0.9;
          } else {
            formWidth = 400;
          }

          return Center(
            child: SingleChildScrollView(
              child: SizedBox(
                width: formWidth,
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [

                      Image.asset(
                        "assets/logo.png",
                        width: formWidth * 0.6,
                      ),

                      const SizedBox(height: 30),

                      _buildTextField("Full Name"),
                      const SizedBox(height: 20),

                      _buildTextField("Email"),
                      const SizedBox(height: 20),

                      _buildTextField("Phone"),
                      const SizedBox(height: 20),

                      _buildPasswordField(
                        "Password",
                        _passwordController,
                        _isPasswordVisible,
                        () {
                          setState(() {
                            _isPasswordVisible =
                                !_isPasswordVisible;
                          });
                        },
                      ),
                      const SizedBox(height: 20),

                      _buildPasswordField(
                        "Confirm Password",
                        _confirmPasswordController,
                        _isConfirmPasswordVisible,
                        () {
                          setState(() {
                            _isConfirmPasswordVisible =
                                !_isConfirmPasswordVisible;
                          });
                        },
                      ),

                      const SizedBox(height: 25),

                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.mossGreen,
                            shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(30),
                            ),
                          ),
                          onPressed: _register,
                          child: const Text(
                            "REGISTER",
                            style:
                                TextStyle(color: Colors.white),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      Row(
                        mainAxisAlignment:
                            MainAxisAlignment.center,
                        children: [
                          const Text(
                              "Already have an account? "),
                          GestureDetector(
                            onTap: () {
                              Navigator.pop(context);
                            },
                            child: const Text(
                              "Login",
                              style: TextStyle(
                                color: AppColors.mossGreen,
                                fontWeight:
                                    FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      )
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

  Widget _buildTextField(String hint) {
    return TextFormField(
      validator: (value) {
        if (value == null || value.isEmpty) {
          return "Required";
        }
        return null;
      },
      decoration: InputDecoration(
        hintText: hint,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
    );
  }

  Widget _buildPasswordField(
    String hint,
    TextEditingController controller,
    bool isVisible,
    VoidCallback toggle,
  ) {
    return TextFormField(
      controller: controller,
      obscureText: !isVisible,
      validator: (value) {
        if (value == null || value.isEmpty) {
          return "Required";
        }
        return null;
      },
      decoration: InputDecoration(
        hintText: hint,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20),
        suffixIcon: IconButton(
          icon: Icon(
            isVisible
                ? Icons.visibility
                : Icons.visibility_off,
          ),
          onPressed: toggle,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
    );
  }
}