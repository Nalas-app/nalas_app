import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'theme.dart';

class AddressScreen extends StatefulWidget {
  const AddressScreen({super.key});

  @override
  State<AddressScreen> createState() => _AddressScreenState();
}

class _AddressScreenState extends State<AddressScreen> {
  List<Map<String, String>> _addresses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('saved_addresses');
    if (raw != null) {
      try {
        final List decoded = json.decode(raw);
        _addresses = decoded
            .map((a) => Map<String, String>.from(a as Map))
            .toList();
      } catch (_) {
        _addresses = [];
      }
    }
    setState(() => _isLoading = false);
  }

  Future<void> _saveAddresses() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('saved_addresses', json.encode(_addresses));
  }

  void _showAddEditDialog({int? editIndex}) {
    final isEdit = editIndex != null;
    final labelController = TextEditingController(
      text: isEdit ? _addresses[editIndex]['label'] : '',
    );
    final addressController = TextEditingController(
      text: isEdit ? _addresses[editIndex]['address'] : '',
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isEdit ? "Edit Address" : "Add New Address"),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: labelController,
                decoration: const InputDecoration(
                  labelText: "Label",
                  hintText: "e.g. Home, Work, Venue",
                  prefixIcon: Icon(Icons.label),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: addressController,
                decoration: const InputDecoration(
                  labelText: "Full Address",
                  hintText: "Enter the complete address",
                  prefixIcon: Icon(Icons.location_on),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.mossGreen,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              final label = labelController.text.trim();
              final address = addressController.text.trim();

              if (label.isEmpty || address.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text("Please fill in both fields"),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }

              setState(() {
                if (isEdit) {
                  _addresses[editIndex] = {
                    'label': label,
                    'address': address,
                  };
                } else {
                  _addresses.add({
                    'label': label,
                    'address': address,
                  });
                }
              });
              _saveAddresses();
              Navigator.pop(ctx);

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(isEdit ? "Address updated" : "Address added"),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: Text(isEdit ? "Update" : "Add"),
          ),
        ],
      ),
    );
  }

  void _deleteAddress(int index) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Delete Address"),
        content: Text("Remove \"${_addresses[index]['label']}\"?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              setState(() => _addresses.removeAt(index));
              _saveAddresses();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Address deleted"),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text("Delete", style: TextStyle(color: Colors.red)),
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
        title: const Text("Saved Addresses"),
        backgroundColor: AppColors.mossGreen,
        foregroundColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.mossGreen,
        onPressed: () => _showAddEditDialog(),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _addresses.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.location_off, size: 64, color: Colors.grey.shade400),
                      const SizedBox(height: 10),
                      const Text(
                        "No saved addresses",
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        "Tap + to add your first address",
                        style: TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(10),
                  itemCount: _addresses.length,
                  itemBuilder: (context, index) {
                    final addr = _addresses[index];
                    return Card(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                      margin: const EdgeInsets.symmetric(vertical: 5),
                      child: ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.mossGreen.withAlpha(30),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.location_on,
                            color: AppColors.mossGreen,
                          ),
                        ),
                        title: Text(
                          addr['label'] ?? 'Address',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(addr['address'] ?? ''),
                        trailing: PopupMenuButton<String>(
                          onSelected: (value) {
                            if (value == 'edit') {
                              _showAddEditDialog(editIndex: index);
                            } else if (value == 'delete') {
                              _deleteAddress(index);
                            }
                          },
                          itemBuilder: (_) => [
                            const PopupMenuItem(
                              value: 'edit',
                              child: Row(
                                children: [
                                  Icon(Icons.edit, size: 18),
                                  SizedBox(width: 8),
                                  Text('Edit'),
                                ],
                              ),
                            ),
                            const PopupMenuItem(
                              value: 'delete',
                              child: Row(
                                children: [
                                  Icon(Icons.delete, size: 18, color: Colors.red),
                                  SizedBox(width: 8),
                                  Text('Delete', style: TextStyle(color: Colors.red)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}