import 'package:flutter/material.dart';

class AppColors {
  static const sandalBackground = Color(0xFFF5F2E8);
  static const sandalBeige = Color(0xFFFFF9EC);
  static const sandalBeigeLight = Color(0xFFFFFDF7);
  static const sandalLight = Color(0xFFFEFBF3);
  static const sandalDark = Color(0xFFE5DECC);
  static const mossGreen = Color(0xFF7BA03C);
  static const mossGreenDark = Color(0xFF5A7A2E);
  static const orangeAccent = Color(0xFFFF8C42);
  static const orangeLight = Color(0xFFFFF2EB);
  static const textDark = Color(0xFF2E2E2E);
  static const textSecondary = Color(0xFF757575);
  static const shimmerBase = Color(0xFFE0E0E0);
  static const shimmerHighlight = Color(0xFFF5F5F5);
  static const dividerColor = Color(0xFFE0E0E0);
  static const surfaceWhite = Colors.white;
}

ThemeData appTheme = ThemeData(
  scaffoldBackgroundColor: AppColors.sandalBackground,
  fontFamily: 'Poppins',
);
