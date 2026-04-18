import 'package:flutter/material.dart';
import '/theme.dart';

class AddressScreen extends StatelessWidget {
  const AddressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sandalBackground,

      appBar: AppBar(
        title: const Text("Saved Addresses"),
        backgroundColor: AppColors.mossGreen,
      ),

      body: Column(
        children: [

          _addressCard(
            "Home",
            "123 Main Street, Vijayawada",
          ),

          _addressCard(
            "Work",
            "IT Park, Hyderabad",
          ),

          const SizedBox(height: 20),

          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.mossGreen,
            ),
            onPressed: () {},
            child: const Text("Add New Address"),
          )
        ],
      ),
    );
  }

  Widget _addressCard(String title, String address) {
    return Card(
      margin: const EdgeInsets.all(10),
      child: ListTile(
        leading: const Icon(Icons.location_on),
        title: Text(title),
        subtitle: Text(address),
      ),
    );
  }
}