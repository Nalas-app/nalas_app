import 'package:flutter/material.dart';
import '/theme.dart';

class OrderHistoryScreen extends StatelessWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,

      appBar: AppBar(
        title: const Text("Order History"),
        backgroundColor: AppColors.mossGreen,
      ),

      body: ListView(
        children: [

          _orderCard(
            "Chicken Biryani",
            "₹300",
            "Delivered",
          ),

          _orderCard(
            "Paneer Butter Masala",
            "₹250",
            "Delivered",
          ),

          _orderCard(
            "Veg Fried Rice",
            "₹180",
            "Cancelled",
          ),
        ],
      ),
    );
  }

  Widget _orderCard(String title, String price, String status) {
    return Card(
      margin: const EdgeInsets.all(10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: ListTile(
        title: Text(title),
        subtitle: Text(price),
        trailing: Text(
          status,
          style: TextStyle(
            color: status == "Delivered"
                ? Colors.green
                : Colors.red,
          ),
        ),
      ),
    );
  }
}