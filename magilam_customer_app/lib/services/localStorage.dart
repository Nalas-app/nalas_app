import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  static const String _themeModeKey = 'theme_mode';
  static const String _authTokenKey = 'auth_token';

  static const String _userRoleKey = 'user_role';
  static const String _userIdKey = 'user_id';

  final SharedPreferences _prefs;

  LocalStorageService(this._prefs);

  static Future<LocalStorageService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return LocalStorageService(prefs);
  }

  // Theme Mode (true for dark, false for light)
  bool? getThemeMode() {
    return _prefs.getBool(_themeModeKey);
  }

  Future<void> setThemeMode(bool isDarkMode) async {
    await _prefs.setBool(_themeModeKey, isDarkMode);
  }

  // Auth Data
  String? getAuthToken() {
    return _prefs.getString(_authTokenKey);
  }

  String? getUserRole() {
    return _prefs.getString(_userRoleKey);
  }

  String? getUserId() {
    return _prefs.getString(_userIdKey);
  }

  Future<void> setAuthData({required String token, required String role, required String userId}) async {
    await _prefs.setString(_authTokenKey, token);
    await _prefs.setString(_userRoleKey, role);
    await _prefs.setString(_userIdKey, userId);
  }

  Future<void> clearAuthData() async {
    await _prefs.remove(_authTokenKey);
    await _prefs.remove(_userRoleKey);
    await _prefs.remove(_userIdKey);
  }

  // Convenience methods used by AuthProvider
  Future<void> setAuthToken(String token) async {
    await _prefs.setString(_authTokenKey, token);
  }

  Future<void> clearAuthToken() async {
    await clearAuthData();
  }
}
