import 'package:flutter/material.dart';
import '../theme.dart';
import '../cart.dart';

class BillingScreen extends StatelessWidget {
  final bool isFromOrder;

  const BillingScreen({super.key, this.isFromOrder = false});

  @override
  Widget build(BuildContext context) {

    // 🔥 CART MODE (from menu icon)
    if (!isFromOrder) {
      return Scaffold(
        backgroundColor: AppColors.sandalBackground,

        appBar: AppBar(
          title: const Text("Your Cart"),
          backgroundColor: AppColors.mossGreen,
        ),

        body: Cart.items.isEmpty
            ? const Center(
                child: Text(
                  "Your cart is empty",
                  style: TextStyle(fontSize: 18),
                ),
              )
            : Column(
                children: [

                  const SizedBox(height: 10),

                  // 🔥 LOGO
                  Center(
                    child: Image.asset(
                      'assets/logo.png',
                      height: 70,
                    ),
                  ),

                  const SizedBox(height: 10),

                  Expanded(
                    child: ListView(
                      children: Cart.items.keys.map((name) {
                        int qty = Cart.items[name]!;
                        int price = Cart.prices[name]!;

                        return ListTile(
                          title: Text(name),
                          subtitle: Text("Qty: $qty"),
                          trailing: Text("₹${qty * price}"),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
      );
    }

    // 🔥 BILLING MODE (after DateTime)
    int total = Cart.getTotal();

    return Scaffold(
      backgroundColor: AppColors.sandalBackground,

      appBar: AppBar(
        title: const Text("Billing"),
        backgroundColor: AppColors.mossGreen,
      ),

      body: Column(
        children: [

          const SizedBox(height: 10),

          // 🔥 LOGO
          Center(
            child: Image.asset(
              'assets/logo.png',
              height: 70,
            ),
          ),

          const SizedBox(height: 10),

          Expanded(
            child: ListView(
              children: Cart.items.keys.map((name) {
                int qty = Cart.items[name]!;
                int price = Cart.prices[name]!;

                return ListTile(
                  title: Text(name),
                  subtitle: Text("Qty: $qty"),
                  trailing: Text("₹${qty * price}"),
                );
              }).toList(),
            ),
          ),

          const Divider(),

          Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              children: [

                Text(
                  "Total: ₹$total",
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 15),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.mossGreen,
                    ),
                    onPressed: () {
                      Navigator.pushNamed(context, '/success');
                    },
                    child: const Text("Confirm Order"),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}