import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class OrderProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<Order> _orders = [];
  Order? _selectedOrder;
  bool _isLoading = false;
  String? _error;

  // ─── Getters ──────────────────────────────────────────────

  List<Order> get orders => _orders;
  Order? get selectedOrder => _selectedOrder;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // ─── Load All My Orders ───────────────────────────────────

  Future<void> loadOrders({String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.fetchMyOrders(status: status);
      debugPrint('=== ORDER HISTORY RAW RESPONSE ===');
      debugPrint('Type: ${response.runtimeType}');
      debugPrint('Value: $response');

      List<dynamic> data = _extractOrderList(response);

      debugPrint('Extracted ${data.length} orders');
      _orders = data.map((o) => Order.fromJson(o as Map<String, dynamic>)).toList();
      _error = null;
    } on DioException catch (e) {
      _error = _extractDioError(e);
      debugPrint('DioException loading orders: $_error');
      debugPrint('Status: ${e.response?.statusCode}');
      debugPrint('Body: ${e.response?.data}');
    } catch (e) {
      _error = 'Failed to load orders: $e';
      debugPrint('Error loading orders: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Robustly extract the list of orders from various API response shapes
  List<dynamic> _extractOrderList(dynamic response) {
    if (response == null) return [];

    // Direct list
    if (response is List) return response;

    if (response is Map) {
      // { success: true, data: [ ... ] }
      if (response['data'] is List) {
        return response['data'];
      }

      // { success: true, data: { orders: [ ... ] } }
      if (response['data'] is Map) {
        final innerData = response['data'];
        if (innerData['orders'] is List) return innerData['orders'];
        if (innerData['data'] is List) return innerData['data'];
      }

      // { orders: [ ... ] }
      if (response['orders'] is List) {
        return response['orders'];
      }

      // { success: true, data: { ... single order } }  — wrap in list
      if (response['data'] is Map && response['data']['id'] != null) {
        return [response['data']];
      }
    }

    return [];
  }

  // ─── Load Single Order Detail ─────────────────────────────

  Future<Order?> loadOrderDetail(String orderId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.fetchOrder(orderId);
      debugPrint('=== ORDER DETAIL RAW RESPONSE ===');
      debugPrint('$response');

      Map<String, dynamic>? data;
      if (response['data'] is Map) {
        data = response['data'];
      } else if (response.containsKey('id')) {
        data = response;
      }

      if (data != null) {
        _selectedOrder = Order.fromJson(data);
      }
    } on DioException catch (e) {
      _error = _extractDioError(e);
    } catch (e) {
      _error = 'Failed to load order: $e';
      debugPrint('Error loading order detail: $e');
    }

    _isLoading = false;
    notifyListeners();
    return _selectedOrder;
  }

  // ─── Update Draft Order ───────────────────────────────────

  Future<bool> updateOrder(String orderId, Map<String, dynamic> orderData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.updateOrder(orderId, orderData);

      if (response['success'] == true || response.containsKey('id') ||
          (response['data'] is Map && response['data']['id'] != null)) {
        // Refresh the order list
        await loadOrders();
        return true;
      } else {
        _error = response['error']?['message'] ?? response['message'] ?? 'Failed to update order';
      }
    } on DioException catch (e) {
      _error = _extractDioError(e);
    } catch (e) {
      _error = 'Unable to update order: $e';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Cancel Draft Order ───────────────────────────────────

  Future<bool> cancelOrder(String orderId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.cancelOrder(orderId);

      if (response['success'] == true || response.containsKey('message') ||
          response['data'] != null) {
        // Remove from local list
        _orders.removeWhere((o) => o.id == orderId);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['error']?['message'] ?? 'Failed to cancel order';
      }
    } on DioException catch (e) {
      _error = _extractDioError(e);
    } catch (e) {
      _error = 'Unable to cancel order: $e';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void clearSelectedOrder() {
    _selectedOrder = null;
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
