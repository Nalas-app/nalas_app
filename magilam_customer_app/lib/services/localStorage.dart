import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  static const String _themeModeKey = 'theme_mode';
  static const String _authTokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userRoleKey = 'user_role';
  static const String _userIdKey = 'user_id';
  static const String _fullNameKey = 'user_full_name';
  static const String _phoneKey = 'user_phone';
  static const String _emailKey = 'user_email';
  static const String _addressKey = 'user_address';

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

  String? getRefreshToken() {
    return _prefs.getString(_refreshTokenKey);
  }

  String? getUserRole() {
    return _prefs.getString(_userRoleKey);
  }

  String? getUserId() {
    return _prefs.getString(_userIdKey);
  }

  String? getFullName() {
    return _prefs.getString(_fullNameKey);
  }

  String? getPhone() {
    return _prefs.getString(_phoneKey);
  }

  String? getEmail() {
    return _prefs.getString(_emailKey);
  }

  String? getAddress() {
    return _prefs.getString(_addressKey);
  }

  Future<void> setAuthData({
    required String token,
    required String role,
    required String userId,
    String? refreshToken,
  }) async {
    await _prefs.setString(_authTokenKey, token);
    await _prefs.setString(_userRoleKey, role);
    await _prefs.setString(_userIdKey, userId);
    if (refreshToken != null) {
      await _prefs.setString(_refreshTokenKey, refreshToken);
    }
  }

  Future<void> setFullName(String name) async {
    await _prefs.setString(_fullNameKey, name);
  }

  Future<void> setPhone(String phone) async {
    await _prefs.setString(_phoneKey, phone);
  }

  Future<void> setEmail(String email) async {
    await _prefs.setString(_emailKey, email);
  }

  Future<void> setAddress(String address) async {
    await _prefs.setString(_addressKey, address);
  }

  Future<void> clearAuthData() async {
    await _prefs.remove(_authTokenKey);
    await _prefs.remove(_refreshTokenKey);
    await _prefs.remove(_userRoleKey);
    await _prefs.remove(_userIdKey);
    await _prefs.remove(_fullNameKey);
    await _prefs.remove(_phoneKey);
    await _prefs.remove(_emailKey);
    await _prefs.remove(_addressKey);
  }

  // Convenience methods used by AuthProvider
  Future<void> setAuthToken(String token) async {
    await _prefs.setString(_authTokenKey, token);
  }

  Future<void> clearAuthToken() async {
    await clearAuthData();
  }
}
