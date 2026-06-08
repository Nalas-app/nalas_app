import 'package:flutter/material.dart';
 import '../theme.dart';
import 'package:provider/provider.dart';
import 'providers/menu_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/auth_provider.dart';

class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {

   @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MenuProvider>().loadCategories();
      context.read<MenuProvider>().loadMenuItems();
    });
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Logout"),
        content: const Text("Are you sure you want to logout?"),
        actions: [

          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text("Cancel"),
          ),

           TextButton(
            onPressed: () {
              context.read<CartProvider>().clearCart();
              context.read<AuthProvider>().logout();

              Navigator.pushNamedAndRemoveUntil(
                context,
                '/login',
                (route) => false,
              );
            },
            child: const Text("Logout"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,

      appBar: AppBar(
        title: const Text("Menu"),
        backgroundColor: AppColors.mossGreen,

        actions: [

           // 🛒 CART BADGE
          Consumer<CartProvider>(
            builder: (context, cart, child) => Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart, color: Colors.white),
                  onPressed: () {
                    Navigator.pushNamed(context, '/billing');
                  },
                ),
                if (cart.totalQuantity > 0)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        cart.totalQuantity.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // PROFILE BUTTON
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () {
                Navigator.pushNamed(context, '/profile');
              },
              child: Row(
                children: const [
                  Icon(Icons.person, color: Colors.white),
                  SizedBox(width: 5),
                  Text("Profile", style: TextStyle(color: Colors.white)),
                ],
              ),
            ),
          ),

          // 🔥 LOGOUT BUTTON WITH CONFIRMATION
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            tooltip: "Logout",
            onPressed: _showLogoutDialog,
          ),
        ],
      ),

      body: Column(
  children: [

    const SizedBox(height: 10),

    // 🔥 LOGO (ADDED)
    Center(
      child: Image.asset(
        'assets/logo.png',
        height: 60,
      ),
    ),

    const SizedBox(height: 10),

    // 👉 KEEP EVERYTHING BELOW SAME

           // 🔥 CATEGORY BUBBLES
          Consumer<MenuProvider>(
            builder: (context, menuProvider, child) {
              final categories = menuProvider.categories;
              
              if (menuProvider.isLoadingCategories) {
                return const Center(child: CircularProgressIndicator());
              }

              return SizedBox(
                height: 70,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: categories.length + 1,
                  itemBuilder: (context, index) {
                    bool isAll = index == 0;
                    String? catId = isAll ? null : categories[index - 1].id;
                    String catName = isAll ? "All" : categories[index - 1].name;
                    bool isSelected = menuProvider.selectedCategoryId == catId;

                    return GestureDetector(
                      onTap: () {
                        menuProvider.selectCategory(catId);
                      },
                      child: Container(
                        margin: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 15),
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.mossGreen
                              : Colors.white,
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Center(
                          child: Text(
                            catName,
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : Colors.black,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),

          // 🔥 FOOD LIST
          Expanded(
            child: Consumer2<MenuProvider, CartProvider>(
              builder: (context, menu, cart, child) {
                final displayItems = menu.filteredItems;

                if (menu.isLoadingItems) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (displayItems.isEmpty) {
                  return const Center(child: Text("No items found"));
                }

                return ListView.builder(
                  itemCount: displayItems.length,
                  itemBuilder: (context, index) {
                    final item = displayItems[index];
                    int qty = cart.getQuantity(item.id);

                    return Card(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: ListTile(
                        leading: (item.imageUrl != null)
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  item.imageUrl!,
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Icon(Icons.fastfood),
                                ),
                              )
                            : null,
                        title: Text(item.name),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("₹${item.pricePerUnit} per ${item.baseUnit}"),
                            if (item.minQuantity > 1)
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  "Min Qty: ${item.minQuantity.toInt()}",
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.orange.shade800,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        trailing: qty == 0
                            ? ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.mossGreen,
                                ),
                                onPressed: () {
                                  cart.addItem(item);
                                },
                                child: const Text("Add"),
                              )
                            : Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: Icon(
                                      qty <= item.minQuantity.toInt()
                                          ? Icons.delete_outline
                                          : Icons.remove,
                                      color: qty <= item.minQuantity.toInt()
                                          ? Colors.red
                                          : Colors.black,
                                    ),
                                    onPressed: () => cart.removeItem(item.id),
                                  ),
                                  Text(
                                    qty.toString(),
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add),
                                    onPressed: () => cart.addItem(item),
                                  ),
                                ],
                              ),
                      ),
                    );
                  },
                );
              },
            ),
          ),

          // 🔥 PROCEED BUTTON
          Padding(
            padding: const EdgeInsets.all(10),
            child: Consumer<CartProvider>(
              builder: (context, cart, child) => SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.mossGreen,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  onPressed: () {
                    if (cart.itemCount == 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text("Please add at least one item"),
                          backgroundColor: Colors.red,
                        ),
                      );
                      return;
                    }
                    Navigator.pushNamed(context, '/datetime');
                  },
                  child: const Text("Proceed"),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}