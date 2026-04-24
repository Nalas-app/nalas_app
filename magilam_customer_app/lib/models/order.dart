class Order {
  final String id;
  final String status;
  final double totalAmount;
  final String? eventDate;
  final String? eventTime;
  final int? guestCount;
  final String? venueAddress;
  final List<OrderItem> items;
  final DateTime? createdAt;

  Order({
    required this.id,
    required this.status,
    required this.totalAmount,
    this.eventDate,
    this.eventTime,
    this.guestCount,
    this.venueAddress,
    this.items = const [],
    this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final itemsList = json['order_items'] as List? ?? [];
    return Order(
      id: json['id']?.toString() ?? '',
      status: json['status'] ?? 'unknown',
      totalAmount: (json['total_amount'] ?? 0).toDouble(),
      eventDate: json['event_date'],
      eventTime: json['event_time'],
      guestCount: json['guest_count'],
      venueAddress: json['venue_address'],
      items: itemsList.map((i) => OrderItem.fromJson(i)).toList(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
    );
  }
}

class OrderItem {
  final String id;
  final String? menuItemName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  OrderItem({
    required this.id,
    this.menuItemName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id']?.toString() ?? '',
      menuItemName: json['menu_item_name'] ?? json['name'],
      quantity: json['quantity'] ?? 0,
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      totalPrice: (json['total_price'] ?? 0).toDouble(),
    );
  }
}
