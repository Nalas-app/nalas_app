import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  static const String baseUrl = 'https://nalas-backend-0ghu.onrender.com/api/v1';

  late Dio _dio;
  String? _authToken;
  String? _refreshToken;

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_authToken != null) {
          options.headers['Authorization'] = 'Bearer $_authToken';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401 && _refreshToken != null) {
          // Attempt to refresh the token
          try {
            final refreshDio = Dio(BaseOptions(
              baseUrl: baseUrl,
              headers: {'Content-Type': 'application/json'},
            ));
            final response = await refreshDio.post('/auth/refresh', data: {
              'refreshToken': _refreshToken,
            });

            if (response.data['success'] == true && response.data['data'] != null) {
              final newToken = response.data['data']['accessToken'] ?? response.data['data']['token'];
              if (newToken != null) {
                _authToken = newToken;
                // Retry the original request with the new token
                e.requestOptions.headers['Authorization'] = 'Bearer $newToken';
                final retryResponse = await _dio.fetch(e.requestOptions);
                return handler.resolve(retryResponse);
              }
            }
          } catch (_) {
            // Refresh failed — clear tokens
            debugPrint('Token refresh failed');
          }
          _authToken = null;
          _refreshToken = null;
        }
        return handler.next(e);
      },
    ));
  }

  void setToken(String token) {
    _authToken = token;
  }

  void setRefreshToken(String token) {
    _refreshToken = token;
  }

  void clearToken() {
    _authToken = null;
    _refreshToken = null;
  }

  String? get token => _authToken;
  Dio get dio => _dio;

  // ─── Auth Endpoints ────────────────────────────────────────

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String phone,
    required String fullName,
  }) async {
    final response = await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'phone': phone,
      'fullName': fullName,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> logout() async {
    try {
      final response = await _dio.post('/auth/logout');
      return response.data;
    } finally {
      clearToken();
    }
  }
  Future<Map<String, dynamic>> confirmOrder(String orderId) async {
  final response = await _dio.post(
    '/orders/$orderId/confirm',
  );
  return response.data;
}

  Future<Map<String, dynamic>> refreshAuthToken() async {
    final response = await _dio.post('/auth/refresh', data: {
      if (_refreshToken != null) 'refreshToken': _refreshToken,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await _dio.post('/auth/forgot-password', data: {
      'email': email,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> resetPassword(String token, String newPassword) async {
    final response = await _dio.post('/auth/reset-password', data: {
      'token': token,
      'password': newPassword,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _dio.get('/auth/profile');
    return response.data;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> profileData) async {
    final response = await _dio.put('/auth/profile', data: profileData);
    return response.data;
  }

  // ─── Menu Endpoints ───────────────────────────────────────

  Future<Map<String, dynamic>> fetchCategories() async {
    final response = await _dio.get('/menu/categories');
    return response.data;
  }

  Future<Map<String, dynamic>> fetchCategory(String categoryId) async {
    final response = await _dio.get('/menu/categories/$categoryId');
    return response.data;
  }

  Future<Map<String, dynamic>> fetchMenuItems({
    String? categoryId,
    int page = 1,
    int limit = 50,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (categoryId != null) {
      queryParams['category_id'] = categoryId;
    }
    final response = await _dio.get('/menu/items', queryParameters: queryParams);
    return response.data;
  }

  Future<Map<String, dynamic>> fetchMenuItem(String itemId) async {
    final response = await _dio.get('/menu/items/$itemId');
    return response.data;
  }

  Future<Map<String, dynamic>> fetchItemRecipe(String itemId) async {
    final response = await _dio.get('/menu/items/$itemId/recipe');
    return response.data;
  }

  // ─── Orders Endpoints ─────────────────────────────────────

  Future<dynamic> fetchMyOrders({
    String? status,
    int page = 1,
  }) async {
    final queryParams = <String, dynamic>{'page': page};
    if (status != null) queryParams['status'] = status;
    final response = await _dio.get('/orders/my-orders', queryParameters: queryParams);
    return response.data;
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    final response = await _dio.post('/orders', data: orderData);
    return response.data;
  }

  Future<Map<String, dynamic>> fetchOrder(String orderId) async {
    final response = await _dio.get('/orders/$orderId');
    return response.data;
  }

  Future<Map<String, dynamic>> updateOrder(String orderId, Map<String, dynamic> orderData) async {
    final response = await _dio.put('/orders/$orderId', data: orderData);
    return response.data;
  }

  Future<Map<String, dynamic>> cancelOrder(String orderId) async {
    final response = await _dio.delete('/orders/$orderId');
    return response.data;
  }

  // ─── Costing Endpoints ────────────────────────────────────

  Future<Map<String, dynamic>> getCostEstimate(
      List<Map<String, dynamic>> items) async {
    final response = await _dio.post('/ml-costing/predictions', data: {
      'items': items,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> reserveStock(String orderId) async {
    final response = await _dio.post('/stock/reserve/$orderId');
    return response.data;
  }


// ───────────────── Billing Endpoints ─────────────────

Future<Map<String, dynamic>> getInvoiceQr(String invoiceId) async {
  final response = await _dio.get(
    '/billing/invoices/$invoiceId/qr',
  );
  return response.data;
}

Future<Map<String, dynamic>> submitPayment({
  required String invoiceId,
  required double amount,
  required String transactionId,
  String paymentMethod = 'upi',
  String paymentType = 'full',
  String notes = 'Paid via Customer App',
}) async {
  final response = await _dio.post(
    '/billing/payments',
    data: {
      "invoice_id": invoiceId,
      "payment_method": paymentMethod,
      "payment_type": paymentType,
      "amount": amount,
      "transaction_id": transactionId,
      "notes": notes,
    },
  );

  return response.data;
}
}
