import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../services/api_service.dart';
import '../services/localStorage.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final LocalStorageService _storage;

  String? _userId;
  String? _email;
  String? _role;
  String? _token;
  String? _fullName;
  String? _phone;
  String? _address;
  bool _isLoading = false;
  String? _error;
  bool _profileLoaded = false;

  AuthProvider(this._storage) {
    _loadToken();
  }

  void _loadToken() {
    _token = _storage.getAuthToken();
    _role = _storage.getUserRole();
    _userId = _storage.getUserId();
    _fullName = _storage.getFullName();
    _phone = _storage.getPhone();
    _email = _storage.getEmail();
    _address = _storage.getAddress();

    if (_token != null) {
      _api.setToken(_token!);
    }

    final refreshToken = _storage.getRefreshToken();
    if (refreshToken != null) {
      _api.setRefreshToken(refreshToken);
    }
  }

  // ─── Getters ──────────────────────────────────────────────

  String? get userId => _userId;
  String? get email => _email;
  String? get role => _role;
  String? get token => _token;
  String? get fullName => _fullName;
  String? get phone => _phone;
  String? get address => _address;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _token != null;
  bool get profileLoaded => _profileLoaded;

  Future<bool> tryAutoLogin() async {
    final token = _storage.getAuthToken();
    if (token == null) return false;

    _token = token;
    _role = _storage.getUserRole();
    _userId = _storage.getUserId();
    _fullName = _storage.getFullName();
    _phone = _storage.getPhone();
    _email = _storage.getEmail();
    _address = _storage.getAddress();

    _api.setToken(_token!);

    final refreshToken = _storage.getRefreshToken();
    if (refreshToken != null) {
      _api.setRefreshToken(refreshToken);
    }

    notifyListeners();
    // Try to fetch profile (but don't fail if it errors)
    await fetchProfile();
    return true;
  }

  // ─── Login ────────────────────────────────────────────────

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.login(email, password);
      debugPrint('=== LOGIN RESPONSE ===');
      debugPrint('$response');

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        _token = data['accessToken'] ?? data['token'];
        _userId = data['user']?['id'];
        _email = data['user']?['email'] ?? email;
        _role = data['user']?['role'];

        final refreshToken = data['refreshToken'];

        if (_token != null) {
          _api.setToken(_token!);
          if (refreshToken != null) {
            _api.setRefreshToken(refreshToken);
          }
          await _storage.setAuthData(
            token: _token!,
            role: _role ?? 'customer',
            userId: _userId?.toString() ?? 'unknown',
            refreshToken: refreshToken,
          );
          if (_email != null) await _storage.setEmail(_email!);

          _isLoading = false;
          notifyListeners();

          // Try to fetch profile but don't block login if it fails
          await fetchProfile();

          return true;
        } else {
          _error = 'No token received from server';
        }
      } else {
        _error = response['error']?['message'] ?? 'Login failed';
      }
    } on DioException catch (e) {
      _error = _extractDioError(e);
    } catch (e) {
      _error = 'Unable to connect to server: $e';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Register ─────────────────────────────────────────────

  Future<bool> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.register(
        email: email,
        password: password,
        phone: phone,
        fullName: fullName,
      );

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        _token = data['token'] ?? data['accessToken'];
        _userId = data['user']?['id'];
        _email = data['user']?['email'] ?? email;
        _role = data['user']?['role'];

        // Store name and phone from the registration form since the
        // backend response doesn't return them
        _fullName = fullName;
        _phone = phone;

        final refreshToken = data['refreshToken'];

        if (_token != null) {
          _api.setToken(_token!);
          if (refreshToken != null) {
            _api.setRefreshToken(refreshToken);
          }
          await _storage.setAuthData(
            token: _token!,
            role: _role ?? 'customer',
            userId: _userId?.toString() ?? 'unknown',
            refreshToken: refreshToken,
          );
          // Persist name, phone, and email locally
          await _storage.setFullName(fullName);
          await _storage.setPhone(phone);
          if (_email != null) await _storage.setEmail(_email!);

          _isLoading = false;
          notifyListeners();
          return true;
        } else {
          _error = 'No token received from server';
        }
      } else {
        _error = response['error']?['message'] ?? 'Registration failed';
      }
    } on DioException catch (e) {
      _error = _extractDioError(e);
    } catch (e) {
      _error = 'Unable to connect to server: $e';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Profile ──────────────────────────────────────────────

  Future<void> fetchProfile() async {
    try {
      final response = await _api.getProfile();
      debugPrint('=== PROFILE RAW RESPONSE ===');
      debugPrint('$response');

      final Map<String, dynamic> data = (response['data'] != null && response['data'] is Map)
          ? response['data']
          : response;

      // Extract fields — accept both camelCase and snake_case
      _userId = data['id']?.toString() ?? _userId;
      _email = data['email'] ?? _email;
      _fullName = data['fullName'] ?? data['full_name'] ?? _fullName;
      _phone = data['phone'] ?? _phone;
      _address = data['address'] ?? _address;
      _role = data['role'] ?? _role;
      _profileLoaded = true;

      // Persist locally for offline access
      if (_fullName != null) await _storage.setFullName(_fullName!);
      if (_phone != null) await _storage.setPhone(_phone!);
      if (_email != null) await _storage.setEmail(_email!);
      if (_address != null) await _storage.setAddress(_address!);

      debugPrint('Profile loaded: name=$_fullName, email=$_email, phone=$_phone');
      notifyListeners();
    } on DioException catch (e) {
      debugPrint('Profile fetch failed (${e.response?.statusCode}): ${e.response?.data}');
      // Don't clear existing data — use what we have from login/register/storage
      _profileLoaded = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      _profileLoaded = true;
      notifyListeners();
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> profileData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      debugPrint('=== UPDATE PROFILE PAYLOAD ===');
      debugPrint('$profileData');

      final response = await _api.updateProfile(profileData);

      debugPrint('=== UPDATE PROFILE RESPONSE ===');
      debugPrint('$response');

      final isSuccess = response['success'] == true
          || response.containsKey('email')
          || response.containsKey('id')
          || response.containsKey('fullName')
          || (response['data'] is Map && response['data']['id'] != null);

      if (isSuccess) {
        // Update local state from the response
        final data = (response['data'] is Map) ? response['data'] : response;
        _fullName = data['fullName'] ?? data['full_name'] ?? profileData['fullName'] ?? _fullName;
        _phone = data['phone'] ?? profileData['phone'] ?? _phone;
        _address = data['address'] ?? profileData['address'] ?? _address;

        // Persist locally
        if (_fullName != null) await _storage.setFullName(_fullName!);
        if (_phone != null) await _storage.setPhone(_phone!);
        if (_address != null) await _storage.setAddress(_address!);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['error']?['message'] ?? response['message'] ?? 'Failed to update profile';
      }
    } on DioException catch (e) {
      _error = _extractDioError(e);
      debugPrint('Update profile DioError: $_error (${e.response?.statusCode})');
      
      // If it's a server error (500), still update local state optimistically
      if (e.response?.statusCode == 500) {
        _fullName = profileData['fullName']?.toString() ?? _fullName;
        _phone = profileData['phone']?.toString() ?? _phone;
        _address = profileData['address']?.toString() ?? _address;
        if (_fullName != null) await _storage.setFullName(_fullName!);
        if (_phone != null) await _storage.setPhone(_phone!);
        if (_address != null) await _storage.setAddress(_address!);
        _error = 'Profile saved locally (server sync pending)';
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = 'Unable to connect to server: $e';
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Forgot Password ─────────────────────────────────────

  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.forgotPassword(email);
      _isLoading = false;
      notifyListeners();
      return response['success'] == true;
    } on DioException catch (e) {
      _error = _extractDioError(e);
    } catch (e) {
      _error = 'Unable to connect to server: $e';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Reset Password ──────────────────────────────────────

  Future<bool> resetPassword(String token, String newPassword) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.resetPassword(token, newPassword);
      _isLoading = false;
      notifyListeners();
      return response['success'] == true;
    } on DioException catch (e) {
      _error = _extractDioError(e);
    } catch (e) {
      _error = 'Unable to connect to server: $e';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Logout ───────────────────────────────────────────────

  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (e) {
      debugPrint('Logout API call failed: $e');
    }
    _token = null;
    _userId = null;
    _email = null;
    _role = null;
    _fullName = null;
    _phone = null;
    _address = null;
    _error = null;
    _profileLoaded = false;
    _api.clearToken();
    await _storage.clearAuthToken();
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // ─── Helpers ──────────────────────────────────────────────

  String _extractDioError(DioException e) {
    final responseData = e.response?.data;
    if (responseData is Map<String, dynamic>) {
      final errorMsg = responseData['error']?['message']
          ?? responseData['message']
          ?? responseData['error'];
      if (errorMsg != null) return errorMsg.toString();
    }
    if (e.response?.statusCode != null) {
      return 'Server error (${e.response!.statusCode})';
    }
    return 'Network error: ${e.message}';
  }
}
