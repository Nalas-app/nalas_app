import 'package:flutter/material.dart';
import '../services/localStorage.dart';

class ThemeProvider extends ChangeNotifier {
  final LocalStorageService _storageService;
  late ThemeMode _themeMode;

  ThemeProvider(this._storageService) {
    _loadTheme();
  }

  ThemeMode get themeMode => _themeMode;

  bool get isDarkMode => _themeMode == ThemeMode.dark;

  void _loadTheme() {
    final isDark = _storageService.getThemeMode();
    if (isDark == null) {
      _themeMode = ThemeMode.system;
    } else {
      _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    }
    notifyListeners();
  }

  Future<void> toggleTheme(bool isDark) async {
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    await _storageService.setThemeMode(isDark);
    notifyListeners();
  }
}
