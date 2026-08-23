class Invoice {
  final String id;
  final String? invoiceNumber;
  final double totalAmount;
  final String? paymentStatus;

  Invoice({
    required this.id,
    this.invoiceNumber,
    required this.totalAmount,
    this.paymentStatus,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    return Invoice(
      id: json['id']?.toString() ?? '',
      invoiceNumber: json['invoice_number']?.toString(),
      totalAmount: parseDouble(json['total_amount'] ?? json['totalAmount']),
      paymentStatus: json['payment_status'] ?? json['paymentStatus'],
    );
  }
}

class Order {
  final String id;
  final String status;
  final double totalAmount;
  final String? eventDate;
  final String? eventTime;
  final String? eventType;
  final int? guestCount;
  final String? venueAddress;
  final List<OrderItem> items;
  final DateTime? createdAt;
  final Invoice? invoice;

  Order({
    required this.id,
    required this.status,
    required this.totalAmount,
    this.eventDate,
    this.eventTime,
    this.eventType,
    this.guestCount,
    this.venueAddress,
    this.items = const [],
    this.createdAt,
    this.invoice,
  });

  bool get isDraft => status.toLowerCase() == 'draft';

  factory Order.fromJson(Map<String, dynamic> json) {
    final itemsList = json['order_items'] ?? json['items'] ?? [];

    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    final invoiceJson = json['invoice'];

    return Order(
      id: json['id']?.toString() ?? '',
      status: json['status'] ?? 'unknown',
      totalAmount: parseDouble(json['total_amount'] ?? json['totalAmount']),
      eventDate: json['event_date'] ?? json['eventDate'],
      eventTime: json['event_time'] ?? json['eventTime'],
      eventType: json['event_type'] ?? json['eventType'],
      guestCount: json['guest_count'] != null
          ? int.tryParse(json['guest_count'].toString().split('.')[0]) ?? 0
          : json['guestCount'] != null
              ? int.tryParse(json['guestCount'].toString().split('.')[0]) ?? 0
              : null,
      venueAddress: json['venue_address'] ?? json['venueAddress'],
      items: (itemsList as List).map((i) => OrderItem.fromJson(i)).toList(),
      createdAt: json['created_at'] != null || json['createdAt'] != null
          ? DateTime.tryParse((json['created_at'] ?? json['createdAt']).toString())
          : null,
      invoice: invoiceJson is Map<String, dynamic> ? Invoice.fromJson(invoiceJson) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'status': status,
        'total_amount': totalAmount,
        'event_date': eventDate,
        'event_time': eventTime,
        'event_type': eventType,
        'guest_count': guestCount,
        'venue_address': venueAddress,
        'order_items': items.map((i) => i.toJson()).toList(),
      };
}

class OrderItem {
  final String id;
  final String? menuItemId;
  final String? menuItemName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  OrderItem({
    required this.id,
    this.menuItemId,
    this.menuItemName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    return OrderItem(
      id: json['id']?.toString() ?? '',
      menuItemId: json['menu_item_id'] ?? json['menuItemId'],
      menuItemName: json['menu_item_name'] ?? json['menuItemName'] ?? json['name'],
      quantity: int.tryParse((json['quantity'] ?? 0).toString().split('.')[0]) ?? 0,
      unitPrice: parseDouble(json['unit_price'] ?? json['unitPrice']),
      totalPrice: parseDouble(json['total_price'] ?? json['totalPrice']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'menu_item_id': menuItemId,
        'menu_item_name': menuItemName,
        'quantity': quantity,
        'unit_price': unitPrice,
        'total_price': totalPrice,
      };
}
