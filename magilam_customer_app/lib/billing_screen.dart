import 'package:flutter/material.dart';
 import '../theme.dart';
import 'package:provider/provider.dart';
import 'providers/cart_provider.dart';

class BillingScreen extends StatelessWidget {
  final bool isFromOrder;

  const BillingScreen({super.key, this.isFromOrder = false});

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();
    // Get event details from route arguments
    final eventDetails = isFromOrder
        ? ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?
        : null;

    // Cost estimation disabled for now — the ML costing endpoint
    // requires recipe data that may not be set up yet.
    // if (isFromOrder && !cartProvider.hasRealEstimate && !cartProvider.isLoadingEstimate) {
    //   Future.microtask(() => cartProvider.fetchCostEstimate(isAdmin: isAdmin));
    // }

    // 🔥 CART MODE (from menu icon)
    if (!isFromOrder) {
      return Scaffold(
        backgroundColor: AppColors.sandalBackground,
        appBar: AppBar(
          title: const Text("Your Cart"),
          backgroundColor: AppColors.mossGreen,
        ),
        body: cartProvider.items.isEmpty
            ? const Center(
                child: Text(
                  "Your cart is empty",
                  style: TextStyle(fontSize: 18),
                ),
              )
            : Column(
                children: [
                   const SizedBox(height: 10),
                   Center(
                    child: Image.asset(
                      'assets/logo.png',
                      height: 70,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: ListView.builder(
                      itemCount: cartProvider.cartItems.length,
                      itemBuilder: (context, index) {
                        final item = cartProvider.cartItems[index];
                        return ListTile(
                          title: Text(item.menuItem.name),
                          subtitle: Text("Qty: ${item.quantity}"),
                          trailing: Text("₹${item.quantity * item.menuItem.pricePerUnit}"),
                        );
                      },
                    ),
                  ),
                ],
              ),
      );
    }

    // 🔥 BILLING MODE (after DateTime)
     final total = cartProvider.estimatedTotal;

    return Scaffold(
      backgroundColor: AppColors.sandalBackground,
      appBar: AppBar(
        title: const Text("Billing"),
        backgroundColor: AppColors.mossGreen,
      ),
      body: Column(
        children: [
          const SizedBox(height: 10),
          Center(
            child: Image.asset(
              'assets/logo.png',
              height: 70,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: ListView.builder(
              itemCount: cartProvider.cartItems.length,
              itemBuilder: (context, index) {
                final item = cartProvider.cartItems[index];
                return ListTile(
                  title: Text(item.menuItem.name),
                  subtitle: Text("Qty: ${item.quantity}"),
                  trailing: Text("₹${item.quantity * item.menuItem.pricePerUnit}"),
                );
              },
            ),
          ),
          
          if (cartProvider.hasRealEstimate) 
            Container(
              padding: const EdgeInsets.all(15),
              color: Colors.grey.withAlpha(25),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Costing Breakdown", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 5),
                  _buildCostRow("Ingredient Cost", cartProvider.ingredientCost),
                  _buildCostRow("Labor Cost", cartProvider.laborCost),
                  _buildCostRow("Overhead Cost", cartProvider.overheadCost),
                ],
              ),
            ),

          const Divider(),
          Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              children: [
                Text(
                  "Total: ₹${total.toStringAsFixed(2)}",
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
                    onPressed: cartProvider.isLoadingEstimate ? null : () async {
                      final result = await cartProvider.confirmOrder(
                        eventDetails: eventDetails,
                      );
                      if (!context.mounted) return;
                      if (result.success) {
                        Navigator.pushNamed(context, '/success');
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(result.message), backgroundColor: Colors.red),
                        );
                      }
                    },
                    child: cartProvider.isLoadingEstimate
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text("Confirm Order"),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildCostRow(String label, double amount) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12)),
          Text("₹${amount.toStringAsFixed(2)}", style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}