class Ingredient {
  final String ingredientId;
  final String ingredientName;
  final String unit;
  final double quantityPerBaseUnit;
  final double wastageFactor;
  final double costPerUnit;
  final double totalCostWithWastage;

  Ingredient({
    required this.ingredientId,
    required this.ingredientName,
    required this.unit,
    required this.quantityPerBaseUnit,
    this.wastageFactor = 1.05,
    required this.costPerUnit,
    required this.totalCostWithWastage,
  });

  factory Ingredient.fromJson(Map<String, dynamic> json) {
    final qty = (json['quantity_per_base_unit'] ?? 0).toDouble();
    final wastage = (json['wastage_factor'] ?? 1.05).toDouble();
    final cost = (json['cost_per_unit'] ?? 0).toDouble();

    return Ingredient(
      ingredientId: json['ingredient_id'] ?? '',
      ingredientName: json['ingredient_name'] ?? '',
      unit: json['unit'] ?? '',
      quantityPerBaseUnit: qty,
      wastageFactor: wastage,
      costPerUnit: cost,
      totalCostWithWastage:
          json['total_cost_with_wastage']?.toDouble() ?? (qty * wastage * cost),
    );
  }
}
