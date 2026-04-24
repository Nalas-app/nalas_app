import 'package:dio/dio.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  static const String baseUrl = 'https://nalas-backend-0ghu.onrender.com/api/v1';

  late Dio _dio;
  String? _authToken;

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
        if (e.response?.statusCode == 401) {
          // Clear token if session is invalid
          _authToken = null;
        }
        return handler.next(e);
      },
    ));
  }

  void setToken(String token) {
    _authToken = token;
  }

  void clearToken() {
    _authToken = null;
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

  // ─── Menu Endpoints ───────────────────────────────────────

  Future<Map<String, dynamic>> fetchCategories() async {
    final response = await _dio.get('/menu/categories');
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

  Future<Map<String, dynamic>> fetchMyOrders({
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
}
