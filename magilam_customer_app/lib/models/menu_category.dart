class MenuCategory {
  final String id;
  final String name;
  final int displayOrder;
  final bool isActive;

  MenuCategory({
    required this.id,
    required this.name,
    required this.displayOrder,
    required this.isActive,
  });

  factory MenuCategory.fromJson(Map<String, dynamic> json) {
    return MenuCategory(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      displayOrder: json['display_order'] ?? 0,
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'display_order': displayOrder,
        'is_active': isActive,
      };
}
