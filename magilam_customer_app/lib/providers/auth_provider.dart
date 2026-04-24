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
  bool _isLoading = false;
  String? _error;

  AuthProvider(this._storage) {
    _loadToken();
  }

  void _loadToken() {
    _token = _storage.getAuthToken();
    _role = _storage.getUserRole();
    _userId = _storage.getUserId();
    
    if (_token != null) {
      _api.setToken(_token!);
    }
  }

  // ─── Getters ──────────────────────────────────────────────

  String? get userId => _userId;
  String? get email => _email;
  String? get role => _role;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _token != null;

  Map<String, dynamic>? get user => {
        'id': _userId,
        'email': _email,
        'role': _role,
      };

  Future<bool> tryAutoLogin() async {
    final token = _storage.getAuthToken();
    if (token == null) return false;
    
    _token = token;
    _role = _storage.getUserRole();
    _userId = _storage.getUserId();
    
    _api.setToken(_token!);
    notifyListeners();
    return true;
  }

  // ─── Login ────────────────────────────────────────────────

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.login(email, password);

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        // Backend login returns accessToken, register returns token
        _token = data['accessToken'] ?? data['token'];
        _userId = data['user']?['id'];
        _email = data['user']?['email'];
        _role = data['user']?['role'];

        if (_token != null) {
          _api.setToken(_token!);
          await _storage.setAuthData(
            token: _token!,
            role: _role ?? 'customer',
            userId: _userId?.toString() ?? 'unknown',
          );

          _isLoading = false;
          notifyListeners();
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
        _email = data['user']?['email'];
        _role = data['user']?['role'];

        if (_token != null) {
          _api.setToken(_token!);
          await _storage.setAuthData(
            token: _token!,
            role: _role ?? 'customer',
            userId: _userId?.toString() ?? 'unknown',
          );

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

  // ─── Logout ───────────────────────────────────────────────

  Future<void> logout() async {
    _token = null;
    _userId = null;
    _email = null;
    _role = null;
    _error = null;
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
      // Try to get error message from response body
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
