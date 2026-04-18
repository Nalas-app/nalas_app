import 'package:flutter/material.dart';
import '../theme.dart';
import '../cart.dart';

class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {

  int selectedIndex = 0;

  final List categories = [
    "All",
    "Veg",
    "Non-Veg",
    "Desserts",
  ];

  final List<Map<String, dynamic>> items = [
    {"name": "Paneer Butter Masala", "price": 250, "category": "Veg"},
    {"name": "Chicken Biryani", "price": 300, "category": "Non-Veg"},
    {"name": "Veg Fried Rice", "price": 180, "category": "Veg"},
    {"name": "Ice Cream", "price": 120, "category": "Desserts"},
  ];

  List get filteredItems {
    if (categories[selectedIndex] == "All") return items;

    return items.where((item) =>
        item["category"] == categories[selectedIndex]).toList();
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
              Cart.clearCart();

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
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart, color: Colors.white),
                onPressed: () {
                  Navigator.pushNamed(context, '/billing');
                },
              ),

              if (Cart.getTotalItems() > 0)
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
                      Cart.getTotalItems().toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ),
            ],
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
          SizedBox(
            height: 70,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              itemBuilder: (context, index) {
                bool isSelected = selectedIndex == index;

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      selectedIndex = index;
                    });
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
                        categories[index],
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
          ),

          // 🔥 FOOD LIST
          Expanded(
            child: ListView.builder(
              itemCount: filteredItems.length,
              itemBuilder: (context, index) {
                var item = filteredItems[index];
                int qty = Cart.items[item["name"]] ?? 0;

                return Card(
                  margin: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: ListTile(
                    title: Text(item["name"]),
                    subtitle: Text("₹${item["price"]}"),

                    trailing: qty == 0
                        ? ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.mossGreen,
                            ),
                            onPressed: () {
                              setState(() {
                                Cart.addItem(
                                    item["name"], item["price"]);
                              });
                            },
                            child: const Text("Add"),
                          )
                        : Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [

                              // ➖
                              IconButton(
                                icon: const Icon(Icons.remove),
                                onPressed: () {
                                  setState(() {
                                    Cart.removeItem(item["name"]);
                                  });
                                },
                              ),

                              // COUNT
                              Text(
                                qty.toString(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),

                              // ➕
                              IconButton(
                                icon: const Icon(Icons.add),
                                onPressed: () {
                                  setState(() {
                                    Cart.addItem(
                                        item["name"], item["price"]);
                                  });
                                },
                              ),
                            ],
                          ),
                  ),
                );
              },
            ),
          ),

          // 🔥 PROCEED BUTTON
          Padding(
            padding: const EdgeInsets.all(10),
            child: SizedBox(
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

                  if (Cart.getTotalItems() == 0) {
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
          )
        ],
      ),
    );
  }
}