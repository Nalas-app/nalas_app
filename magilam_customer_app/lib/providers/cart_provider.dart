import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/cart_item.dart';
import '../models/menu_item.dart';
import '../services/api_service.dart';
import '../services/payment_service.dart';

class CartProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final MockPaymentService _paymentService = MockPaymentService();
  final Map<String, CartItem> _items = {};

  // Costing engine state
  double _ingredientCost = 0;
  double _laborCost = 0;
  double _overheadCost = 0;
  double _costingTotal = 0;
  bool _isLoadingEstimate = false;
  bool _hasRealEstimate = false;

  // ─── Getters ──────────────────────────────────────────────

  Map<String, CartItem> get items => Map.unmodifiable(_items);
  List<CartItem> get cartItems => _items.values.toList();
  int get itemCount => _items.length;
  int get totalQuantity =>
      _items.values.fold(0, (sum, item) => sum + item.quantity);

  // Cost breakdown from Costing Engine
  double get ingredientCost => _ingredientCost;
  double get laborCost => _laborCost;
  double get overheadCost => _overheadCost;
  bool get isLoadingEstimate => _isLoadingEstimate;
  bool get hasRealEstimate => _hasRealEstimate;

  double get estimatedTotal {
    if (_hasRealEstimate) return _costingTotal;
    // Fallback: use per-item prices if costing API unavailable
    return _items.values.fold(
      0.0,
      (sum, item) => sum + (item.quantity * item.menuItem.pricePerUnit),
    );
  }

  bool isInCart(String itemId) => _items.containsKey(itemId);
  int getQuantity(String itemId) => _items[itemId]?.quantity ?? 0;

  // ─── Cart Actions ─────────────────────────────────────────

  void addItem(MenuItem menuItem) {
    if (_items.containsKey(menuItem.id)) {
      _items[menuItem.id]!.quantity++;
    } else {
      // Start at min_quantity from the API (defaults to 1)
      final startQty = menuItem.minQuantity.toInt().clamp(1, 9999);
      _items[menuItem.id] = CartItem(menuItem: menuItem, quantity: startQty);
    }
    notifyListeners();
    fetchCostEstimate(); // Auto-refresh estimate
  }

  void removeItem(String itemId) {
    if (_items.containsKey(itemId)) {
      final cartItem = _items[itemId]!;
      final minQty = cartItem.menuItem.minQuantity.toInt().clamp(1, 9999);
      if (cartItem.quantity > minQty) {
        // Decrease but stay at or above min_quantity
        cartItem.quantity--;
      } else {
        // Already at min_quantity — remove from cart entirely
        _items.remove(itemId);
      }
      notifyListeners();
      if (_items.isNotEmpty) {
        fetchCostEstimate();
      } else {
        _resetEstimate();
      }
    }
  }

  void removeItemCompletely(String itemId) {
    _items.remove(itemId);
    notifyListeners();
    if (_items.isNotEmpty) {
      fetchCostEstimate();
    } else {
      _resetEstimate();
    }
  }

  void updateQuantity(String itemId, int quantity) {
    if (_items.containsKey(itemId)) {
      if (quantity <= 0) {
        _items.remove(itemId);
      } else {
        final minQty = _items[itemId]!.menuItem.minQuantity.toInt().clamp(1, 9999);
        _items[itemId]!.quantity = quantity < minQty ? minQty : quantity;
      }
      notifyListeners();
      if (_items.isNotEmpty) {
        fetchCostEstimate();
      } else {
        _resetEstimate();
      }
    }
  }

  void clearCart() {
    _items.clear();
    _resetEstimate();
    notifyListeners();
  }

  // ─── Costing Engine Integration ───────────────────────────

  /// Fetches an ML-based cost estimate. This endpoint typically requires Admin roles.
  Future<void> fetchCostEstimate({bool isAdmin = false}) async {
    if (_items.isEmpty || !isAdmin) {
      _resetEstimate();
      return;
    }

    _isLoadingEstimate = true;
    notifyListeners();

    try {
      final payload = _items.values.map((item) => item.toEstimateJson()).toList();
      final response = await _api.getCostEstimate(payload);

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        _ingredientCost = (data['ingredient_cost'] ?? 0).toDouble();
        _laborCost = (data['labor_cost'] ?? 0).toDouble();
        _overheadCost = (data['overhead_cost'] ?? 0).toDouble();
        _costingTotal = (data['predicted_total'] ?? 0).toDouble();
        _hasRealEstimate = true;
      } else {
        _hasRealEstimate = false;
      }
    } catch (e) {
      // Swallowing the error (e.g. 401 for customers) to prevent red bars.
      _hasRealEstimate = false;
    }

    _isLoadingEstimate = false;
    notifyListeners();
  }

  /// Manually trigger a cost estimate refresh
  Future<void> refreshEstimate() => fetchCostEstimate();

  void _resetEstimate() {
    _ingredientCost = 0;
    _laborCost = 0;
    _overheadCost = 0;
    _costingTotal = 0;
    _hasRealEstimate = false;
    _isLoadingEstimate = false;
  }

  /// Payload for creating an order — matches backend createOrderSchema
  List<Map<String, dynamic>> toOrderPayload() {
    return _items.values
        .map((item) => {
              'menu_item_id': item.menuItem.id,
              'quantity': item.quantity,
              'customizations': {},
            })
        .toList();
  }

  // ─── Order Confirmation ───────────────────────────────────

  Future<PaymentResult> confirmOrder({Map<String, dynamic>? eventDetails}) async {
    if (_items.isEmpty) {
      return PaymentResult(success: false, message: 'Cart is empty');
    }

    // Client-side min_quantity pre-validation before hitting the API
    for (final cartItem in _items.values) {
      final minQty = cartItem.menuItem.minQuantity.toInt().clamp(1, 9999);
      if (cartItem.quantity < minQty) {
        return PaymentResult(
          success: false,
          message: 'Minimum quantity for ${cartItem.menuItem.name} is $minQty. You have ${cartItem.quantity}.',
        );
      }
    }

    _isLoadingEstimate = true; // Use this as general loading state
    notifyListeners();

    try {
      // 1. Process Payment
      final paymentResult = await _paymentService.processPayment(estimatedTotal);
      if (!paymentResult.success) {
        _isLoadingEstimate = false;
        notifyListeners();
        return paymentResult;
      }

      // 2. Build order data matching backend createOrderSchema
      final orderData = <String, dynamic>{
        'event_date': eventDetails?['event_date'] ?? DateTime.now().add(const Duration(days: 7)).toIso8601String().split('T')[0],
        'event_time': eventDetails?['event_time'] ?? '18:00',
        'event_type': eventDetails?['event_type'] ?? 'Other',
        'guest_count': eventDetails?['guest_count'] ?? 100,
        'venue_address': eventDetails?['venue_address'] ?? 'Venue address not specified',
        'order_items': toOrderPayload(),
      };

      // 3. Create Order
      debugPrint('SENDING PAYLOAD: $orderData');
      final orderResponse = await _api.createOrder(orderData);

      if (orderResponse['success'] != true) {
        _isLoadingEstimate = false;
        notifyListeners();
        return PaymentResult(
          success: false,
          message: orderResponse['error']?['message'] ?? 'Failed to create order',
        );
      }

      // 4. Clear Cart on Success
      clearCart();
      
      _isLoadingEstimate = false;
      notifyListeners();
      return paymentResult;
    } on DioException catch (e) {
      _isLoadingEstimate = false;
      notifyListeners();
      final responseData = e.response?.data;
      String msg = 'Server error';
      if (responseData is Map<String, dynamic>) {
        msg = responseData['error']?['message'] ?? responseData['message'] ?? 'Server error (${e.response?.statusCode})';
        final details = responseData['error']?['details'];
        if (details != null) msg = '$msg: $details';
      }
      return PaymentResult(success: false, message: msg);
    } catch (e) {
      _isLoadingEstimate = false;
      notifyListeners();
      return PaymentResult(success: false, message: 'An error occurred: $e');
    }
  }
}
