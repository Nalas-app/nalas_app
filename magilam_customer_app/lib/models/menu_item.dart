class MenuItem {
  final String id;
  final String categoryId;
  final String? categoryName;
  final String name;
  final String? description;
  final String baseUnit;
  final double minQuantity;
  final String? imageUrl;
  final bool isCustomizable;
  final bool isActive;
  final double pricePerUnit; // Price per base unit (calculated from recipe costs)

  MenuItem({
    required this.id,
    required this.categoryId,
    this.categoryName,
    required this.name,
    this.description,
    required this.baseUnit,
    this.minQuantity = 1,
    this.imageUrl,
    this.isCustomizable = false,
    this.isActive = true,
    this.pricePerUnit = 0,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id']?.toString().toLowerCase() ?? '',
      categoryId: json['category_id']?.toString().toLowerCase() ?? '',
      categoryName: json['category_name'],
      name: json['name'] ?? json['Name'] ?? '',
      description: json['description'] ?? json['Description'],
      baseUnit: json['base_unit'] ?? 'serving',
      minQuantity: _parseDouble(json['min_quantity']) ?? 1.0,
      imageUrl: json['image_url'] ?? json['Image'],
      isCustomizable: json['is_customizable'] ?? false,
      isActive: json['is_active'] ?? true,
      pricePerUnit: _parseDouble(json['price_per_unit'] ?? json['price'] ?? json['Price']) ?? _getFallbackPrice(json['name']),
    );
  }

  static double _getFallbackPrice(String? name) {
    if (name == null) return 50.0;
    final lowerName = name.toLowerCase();
    if (lowerName.contains('dosa')) return 45.0;
    if (lowerName.contains('idli')) return 35.0;
    if (lowerName.contains('pongal')) return 40.0;
    if (lowerName.contains('tikka')) return 180.0;
    if (lowerName.contains('manchurian')) return 140.0;
    if (lowerName.contains('kebab')) return 120.0;
    if (lowerName.contains('chicken 65')) return 220.0;
    if (lowerName.contains('seekh')) return 280.0;
    if (lowerName.contains('biryani')) return 450.0;
    if (lowerName.contains('paneer butter')) return 380.0;
    if (lowerName.contains('dal')) return 280.0;
    if (lowerName.contains('gulab')) return 25.0;
    if (lowerName.contains('rasmalai')) return 35.0;
    if (lowerName.contains('chai')) return 20.0;
    if (lowerName.contains('soda')) return 30.0;
    return 100.0; // Default generic price
  }

  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'category_id': categoryId,
        'name': name,
        'description': description,
        'base_unit': baseUnit,
        'min_quantity': minQuantity,
        'image_url': imageUrl,
        'is_customizable': isCustomizable,
        'is_active': isActive,
        'price_per_unit': pricePerUnit,
      };
}
