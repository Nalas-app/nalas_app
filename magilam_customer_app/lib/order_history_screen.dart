import 'package:flutter/material.dart';
import 'theme.dart';
import 'package:provider/provider.dart';
import 'providers/order_provider.dart';
import 'models/order.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrderProvider>().loadOrders();
    });
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return Colors.green;
      case 'confirmed':
      case 'processing':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      case 'draft':
        return Colors.blueGrey;
      default:
        return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return Icons.check_circle;
      case 'confirmed':
        return Icons.thumb_up;
      case 'processing':
        return Icons.hourglass_bottom;
      case 'cancelled':
        return Icons.cancel;
      case 'draft':
        return Icons.edit_note;
      default:
        return Icons.receipt_long;
    }
  }

  void _showCancelDialog(BuildContext context, Order order) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Cancel Order"),
        content: Text("Are you sure you want to cancel order #${order.id.length > 8 ? order.id.substring(0, 8) : order.id}?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("No"),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final orderProvider = context.read<OrderProvider>();
              final success = await orderProvider.cancelOrder(order.id);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(success ? 'Order cancelled' : orderProvider.error ?? 'Failed to cancel'),
                  backgroundColor: success ? Colors.green : Colors.red,
                ),
              );
            },
            child: const Text("Yes, Cancel", style: TextStyle(color: Colors.red)),
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
        title: const Text("Order History"),
        backgroundColor: AppColors.mossGreen,
        foregroundColor: Colors.white,
      ),
      body: Consumer<OrderProvider>(
        builder: (context, orderProvider, child) {
          if (orderProvider.isLoading && orderProvider.orders.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (orderProvider.error != null && orderProvider.orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 10),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 30),
                    child: Text(
                      orderProvider.error!,
                      style: const TextStyle(fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 15),
                  ElevatedButton.icon(
                    onPressed: () => orderProvider.loadOrders(),
                    icon: const Icon(Icons.refresh),
                    label: const Text("Retry"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.mossGreen,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            );
          }

          if (orderProvider.orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 10),
                  const Text(
                    "No orders yet",
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    "Your order history will appear here",
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => orderProvider.loadOrders(),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: orderProvider.orders.length,
              itemBuilder: (context, index) {
                final order = orderProvider.orders[index];
                final statusColor = _statusColor(order.status);

                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  elevation: 2,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(15),
                    onTap: () {
                      Navigator.pushNamed(context, '/order-detail', arguments: order.id);
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Top row: order id + status badge
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Icon(_statusIcon(order.status), color: statusColor, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    "Order #${order.id.length > 8 ? order.id.substring(0, 8) : order.id}",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusColor.withAlpha(30),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  order.status.toUpperCase(),
                                  style: TextStyle(
                                    color: statusColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const Divider(height: 20),

                          // Details rows
                          if (order.totalAmount > 0)
                            _buildInfoRow(Icons.currency_rupee, "₹${order.totalAmount.toStringAsFixed(2)}"),

                          if (order.eventDate != null)
                            _buildInfoRow(Icons.calendar_today, "Date: ${order.eventDate}"),

                          if (order.eventTime != null)
                            _buildInfoRow(Icons.access_time, "Time: ${order.eventTime}"),

                          if (order.eventType != null)
                            _buildInfoRow(Icons.event, order.eventType!),

                          if (order.guestCount != null)
                            _buildInfoRow(Icons.people, "${order.guestCount} guests"),

                          if (order.items.isNotEmpty)
                            _buildInfoRow(Icons.restaurant_menu, "${order.items.length} item(s)"),

                          // Draft actions
                          if (order.isDraft)
                            Padding(
                              padding: const EdgeInsets.only(top: 10),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: () => _showCancelDialog(context, order),
                                    icon: const Icon(Icons.close, size: 16),
                                    label: const Text("Cancel"),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.red,
                                      side: const BorderSide(color: Colors.red),
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.pushNamed(context, '/order-detail', arguments: order.id);
                                    },
                                    icon: const Icon(Icons.edit, size: 16),
                                    label: const Text("Edit"),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.mossGreen,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }
}