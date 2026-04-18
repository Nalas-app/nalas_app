class Cart {
  static Map<String, int> items = {};
  static Map<String, int> prices = {};

  static void addItem(String name, int price) {
    items[name] = (items[name] ?? 0) + 1;
    prices[name] = price;
  }

  static void removeItem(String name) {
    if (!items.containsKey(name)) return;

    if (items[name]! > 1) {
      items[name] = items[name]! - 1;
    } else {
      items.remove(name);
      prices.remove(name);
    }
  }

  static int getTotal() {
    int total = 0;
    items.forEach((name, qty) {
      total += prices[name]! * qty;
    });
    return total;
  }

  static int getTotalItems() {
    int total = 0;
    items.forEach((key, value) {
      total += value;
    });
    return total;
  }

  static void clearCart() {
    items.clear();
    prices.clear();
  }
}