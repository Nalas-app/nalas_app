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
import 'order_detail_screen.dart';
import 'address_screen.dart';
import 'forgot_password_screen.dart';
import 'package:provider/provider.dart';
import 'services/localStorage.dart';
import 'providers/theme_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/menu_provider.dart';
import 'providers/order_provider.dart';

// Theme
import 'theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final storageService = await LocalStorageService.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider(storageService)),
        ChangeNotifierProvider(create: (_) => AuthProvider(storageService)),
        ChangeNotifierProvider(create: (_) => MenuProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Magilam Foods',

      themeMode: themeProvider.themeMode,
      theme: ThemeData(
        scaffoldBackgroundColor: AppColors.sandalBackground,
        primaryColor: AppColors.mossGreen,
        useMaterial3: true,
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: AppColors.mossGreen,
      ),

      home: const SplashScreen(),

      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/menu': (context) => const MenuScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/billing': (context) => const BillingScreen(),
        '/billingOrder': (context) => const BillingScreen(isFromOrder: true),
        '/success': (context) => const SuccessScreen(),
        '/datetime': (context) => const DateTimeScreen(),
        '/orders': (context) => const OrderHistoryScreen(),
        '/addresses': (context) => const AddressScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
      },
      onGenerateRoute: (settings) {
        // Handle order detail with orderId argument
        if (settings.name == '/order-detail') {
          final orderId = settings.arguments as String;
          return MaterialPageRoute(
            builder: (context) => OrderDetailScreen(orderId: orderId),
          );
        }
        return null;
      },
    );
  }
}