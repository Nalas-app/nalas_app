import 'menu_item.dart';

class CartItem {
  final MenuItem menuItem;
  int quantity;

  CartItem({
    required this.menuItem,
    this.quantity = 1,
  });

  Map<String, dynamic> toEstimateJson() => {
        'menu_item_id': menuItem.id,
        'quantity': quantity,
      };
}
