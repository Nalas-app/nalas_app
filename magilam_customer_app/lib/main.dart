import 'package:flutter/material.dart';


// Existing screens (keep these)
import 'splash_screen.dart';
import 'login_screen.dart';
import 'register_screen.dart';
import 'menu_screen.dart';
import 'profile_screen.dart';
import 'billing_screen.dart';
import 'success_screen.dart';
import 'date_time_screen.dart';
import 'order_history_screen.dart';
import 'address_screen.dart';

// Theme
import 'theme.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Magilam Foods',

      theme: ThemeData(
        scaffoldBackgroundColor: AppColors.sandalBackground,
        primaryColor: AppColors.mossGreen,
        useMaterial3: true,
      ),

      // ✅ KEEP YOUR CURRENT FLOW
      home: const SplashScreen(),

      // ✅ ADD NEW SCREENS HERE (DO NOT REMOVE OLD)
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),

        // 🔥 NEW SCREENS
        '/menu': (context) => MenuScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/billing': (context) => const BillingScreen(),
'/billingOrder': (context) => const BillingScreen(isFromOrder: true),
        '/success': (context) => const SuccessScreen(),
        '/datetime': (context) => const DateTimeScreen(),
        '/orders': (context) => OrderHistoryScreen(),
'/addresses': (context) => AddressScreen(),
      },
    );
  }
}