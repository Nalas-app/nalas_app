import 'package:flutter/material.dart';
import '../models/menu_category.dart';
import '../models/menu_item.dart';
import '../models/ingredient.dart';
import '../services/api_service.dart';

class MenuProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<MenuCategory> _categories = [];
  List<MenuItem> _items = [];
  List<Ingredient> _ingredients = [];
  String? _selectedCategoryId;
  bool _isLoadingCategories = false;
  bool _isLoadingItems = false;
  bool _isLoadingIngredients = false;
  String? _error;

  // ─── Getters ──────────────────────────────────────────────

  List<MenuCategory> get categories => _categories;
  List<MenuItem> get items => _items;
  List<Ingredient> get ingredients => _ingredients;
  String? get selectedCategoryId => _selectedCategoryId;
  bool get isLoadingCategories => _isLoadingCategories;
  bool get isLoadingItems => _isLoadingItems;
  bool get isLoadingIngredients => _isLoadingIngredients;
  String? get error => _error;

  List<MenuItem> get filteredItems {
    if (_selectedCategoryId == null) return _items;
    return _items
        .where((item) => item.categoryId == _selectedCategoryId)
        .toList();
  }

  // ─── Actions ──────────────────────────────────────────────

  Future<void> loadCategories() async {
    _isLoadingCategories = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.fetchCategories();
      final data = response['data'] as List? ?? [];
      _categories = data.map((c) => MenuCategory.fromJson(c)).toList();

      // Auto-select first category
      if (_categories.isNotEmpty && _selectedCategoryId == null) {
        _selectedCategoryId = _categories.first.id;
      }
    } catch (e) {
      _error = 'Failed to load categories: $e';
      _categories = [];
    }

    _isLoadingCategories = false;
    notifyListeners();
  }

  Future<void> loadMenuItems() async {
    _isLoadingItems = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.fetchMenuItems(limit: 100);
      final data = response['data'] as List? ?? [];
      _items = data.map((i) => MenuItem.fromJson(i)).toList();
    } catch (e) {
      _error = 'Failed to load menu items: $e';
      _items = [];
    }

    _isLoadingItems = false;
    notifyListeners();
  }

  void selectCategory(String? categoryId) {
    _selectedCategoryId = categoryId;
    notifyListeners();
  }

  Future<void> loadIngredients(String itemId) async {
    _isLoadingIngredients = true;
    _ingredients = [];
    notifyListeners();

    try {
      final response = await _api.fetchItemRecipe(itemId);
      final data = response['data'];
      if (data != null && data['ingredients'] != null) {
        final ingredientsList = data['ingredients'] as List;
        _ingredients =
            ingredientsList.map((i) => Ingredient.fromJson(i)).toList();
      }
    } catch (e) {
      _error = 'Failed to load ingredients: $e';
      _ingredients = [];
    }

    _isLoadingIngredients = false;
    notifyListeners();
  }

  // ─── Mock Data Fallback ───────────────────────────────────

  List<MenuCategory> _getMockCategories() {
    return [
      MenuCategory(id: 'cat-1', name: 'Breakfast', displayOrder: 1, isActive: true),
      MenuCategory(id: 'cat-2', name: 'Veg Starters', displayOrder: 2, isActive: true),
      MenuCategory(id: 'cat-3', name: 'Non-Veg Starters', displayOrder: 3, isActive: true),
      MenuCategory(id: 'cat-4', name: 'Main Course', displayOrder: 4, isActive: true),
      MenuCategory(id: 'cat-5', name: 'Desserts', displayOrder: 5, isActive: true),
      MenuCategory(id: 'cat-6', name: 'Beverages', displayOrder: 6, isActive: true),
    ];
  }

  List<MenuItem> _getMockMenuItems() {
    return [
      // Breakfast
      MenuItem(id: 'item-1', categoryId: 'cat-1', categoryName: 'Breakfast', name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling served with chutneys & sambar', baseUnit: 'plate', minQuantity: 10, pricePerUnit: 45, imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eb5eaf68a3?w=400'),
      MenuItem(id: 'item-2', categoryId: 'cat-1', categoryName: 'Breakfast', name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup and coconut chutney', baseUnit: 'plate', minQuantity: 10, pricePerUnit: 35, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'),
      MenuItem(id: 'item-3', categoryId: 'cat-1', categoryName: 'Breakfast', name: 'Pongal', description: 'Traditional rice & lentil breakfast with ghee and cashews', baseUnit: 'plate', minQuantity: 10, pricePerUnit: 40, imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400'),
      // Veg Starters
      MenuItem(id: 'item-4', categoryId: 'cat-2', categoryName: 'Veg Starters', name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled in tandoor with mint chutney', baseUnit: 'plate', minQuantity: 5, pricePerUnit: 180, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'),
      MenuItem(id: 'item-5', categoryId: 'cat-2', categoryName: 'Veg Starters', name: 'Gobi Manchurian', description: 'Indo-Chinese crispy cauliflower tossed in tangy sauce', baseUnit: 'plate', minQuantity: 5, pricePerUnit: 140, imageUrl: 'https://images.unsplash.com/photo-1626500155615-30d79b0f2537?w=400'),
      MenuItem(id: 'item-6', categoryId: 'cat-2', categoryName: 'Veg Starters', name: 'Hara Bhara Kebab', description: 'Spinach & green pea patties with aromatic spices', baseUnit: 'plate', minQuantity: 5, pricePerUnit: 120, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400'),
      // Non-Veg Starters
      MenuItem(id: 'item-7', categoryId: 'cat-3', categoryName: 'Non-Veg Starters', name: 'Chicken 65', description: 'Spicy deep-fried chicken with curry leaves & red chili', baseUnit: 'plate', minQuantity: 5, pricePerUnit: 220, imageUrl: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=400'),
      MenuItem(id: 'item-8', categoryId: 'cat-3', categoryName: 'Non-Veg Starters', name: 'Mutton Seekh Kebab', description: 'Minced lamb skewers with aromatic spices from tandoor', baseUnit: 'plate', minQuantity: 5, pricePerUnit: 280, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'),
      // Main Course
      MenuItem(id: 'item-9', categoryId: 'cat-4', categoryName: 'Main Course', name: 'Chicken Biryani', description: 'Aromatic basmati rice layered with spiced chicken & saffron', baseUnit: 'kg', minQuantity: 2, pricePerUnit: 450, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400'),
      MenuItem(id: 'item-10', categoryId: 'cat-4', categoryName: 'Main Course', name: 'Paneer Butter Masala', description: 'Rich tomato-cashew gravy with soft cottage cheese cubes', baseUnit: 'kg', minQuantity: 1, pricePerUnit: 380, imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400'),
      MenuItem(id: 'item-11', categoryId: 'cat-4', categoryName: 'Main Course', name: 'Dal Makhani', description: 'Slow-cooked black lentils in a creamy butter sauce', baseUnit: 'kg', minQuantity: 1, pricePerUnit: 280, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'),
      // Desserts
      MenuItem(id: 'item-12', categoryId: 'cat-5', categoryName: 'Desserts', name: 'Gulab Jamun', description: 'Deep-fried milk dumplings soaked in rose-flavored sugar syrup', baseUnit: 'piece', minQuantity: 20, pricePerUnit: 25, imageUrl: 'https://images.unsplash.com/photo-1666190715654-63a15b5c4280?w=400'),
      MenuItem(id: 'item-13', categoryId: 'cat-5', categoryName: 'Desserts', name: 'Rasmalai', description: 'Soft cottage cheese discs in sweetened saffron milk', baseUnit: 'piece', minQuantity: 20, pricePerUnit: 35, imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400'),
      // Beverages
      MenuItem(id: 'item-14', categoryId: 'cat-6', categoryName: 'Beverages', name: 'Masala Chai', description: 'Spiced Indian tea with cardamom, ginger & cinnamon', baseUnit: 'cup', minQuantity: 10, pricePerUnit: 20, imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400'),
      MenuItem(id: 'item-15', categoryId: 'cat-6', categoryName: 'Beverages', name: 'Fresh Lime Soda', description: 'Refreshing lime juice with sparkling soda & mint', baseUnit: 'glass', minQuantity: 10, pricePerUnit: 30, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400'),
    ];
  }

  List<Ingredient> _getMockIngredients() {
    return [
      Ingredient(ingredientId: 'ing-1', ingredientName: 'Rice Flour', unit: 'kg', quantityPerBaseUnit: 0.15, costPerUnit: 60, totalCostWithWastage: 9.45),
      Ingredient(ingredientId: 'ing-2', ingredientName: 'Black Gram', unit: 'kg', quantityPerBaseUnit: 0.05, costPerUnit: 120, totalCostWithWastage: 6.30),
      Ingredient(ingredientId: 'ing-3', ingredientName: 'Potato', unit: 'kg', quantityPerBaseUnit: 0.10, costPerUnit: 30, totalCostWithWastage: 3.15),
      Ingredient(ingredientId: 'ing-4', ingredientName: 'Turmeric Powder', unit: 'g', quantityPerBaseUnit: 2, costPerUnit: 0.50, totalCostWithWastage: 1.05),
      Ingredient(ingredientId: 'ing-5', ingredientName: 'Coconut Oil', unit: 'ml', quantityPerBaseUnit: 15, costPerUnit: 0.30, totalCostWithWastage: 4.73),
    ];
  }
}
