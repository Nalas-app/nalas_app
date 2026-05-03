import 'package:flutter/material.dart';
import 'theme.dart';
import 'package:provider/provider.dart';
import 'providers/order_provider.dart';
import 'models/order.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrderProvider>().loadOrderDetail(widget.orderId);
    });
  }

  @override
  void dispose() {
    // Don't clear on dispose — let the provider keep state
    super.dispose();
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

  void _showCancelDialog(BuildContext context, Order order) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Cancel Order"),
        content: const Text("Are you sure you want to cancel this draft order? This action cannot be undone."),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("No"),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context); // close dialog
              final orderProvider = context.read<OrderProvider>();
              final success = await orderProvider.cancelOrder(order.id);
              if (!mounted) return;
              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Order cancelled successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
                Navigator.pop(context); // go back to order history
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(orderProvider.error ?? 'Failed to cancel order'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: const Text("Yes, Cancel", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(BuildContext context, Order order) {
    final venueController = TextEditingController(text: order.venueAddress ?? '');
    final guestController = TextEditingController(text: order.guestCount?.toString() ?? '100');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Edit Draft Order"),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: venueController,
                decoration: const InputDecoration(
                  labelText: "Venue Address",
                  prefixIcon: Icon(Icons.location_on),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: guestController,
                decoration: const InputDecoration(
                  labelText: "Guest Count",
                  prefixIcon: Icon(Icons.people),
                ),
                keyboardType: TextInputType.number,
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
            onPressed: () async {
              Navigator.pop(ctx);
              final payload = <String, dynamic>{};
              if (venueController.text.trim().isNotEmpty) {
                payload['venue_address'] = venueController.text.trim();
              }
              final guestCount = int.tryParse(guestController.text);
              if (guestCount != null) {
                payload['guest_count'] = guestCount;
              }
              if (payload.isEmpty) return;

              final orderProvider = context.read<OrderProvider>();
              final success = await orderProvider.updateOrder(order.id, payload);
              if (!mounted) return;

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(success ? 'Order updated!' : orderProvider.error ?? 'Failed to update'),
                  backgroundColor: success ? Colors.green : Colors.red,
                ),
              );

              if (success) {
                orderProvider.loadOrderDetail(widget.orderId);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.mossGreen),
            child: const Text("Save"),
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
        title: const Text("Order Details"),
        backgroundColor: AppColors.mossGreen,
        foregroundColor: Colors.white,
      ),
      body: Consumer<OrderProvider>(
        builder: (context, orderProvider, child) {
          if (orderProvider.isLoading && orderProvider.selectedOrder == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (orderProvider.error != null && orderProvider.selectedOrder == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 10),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 30),
                    child: Text(orderProvider.error!, textAlign: TextAlign.center),
                  ),
                  const SizedBox(height: 15),
                  ElevatedButton.icon(
                    onPressed: () => orderProvider.loadOrderDetail(widget.orderId),
                    icon: const Icon(Icons.refresh),
                    label: const Text("Retry"),
                  ),
                ],
              ),
            );
          }

          final order = orderProvider.selectedOrder;
          if (order == null) {
            return const Center(child: Text("Order not found"));
          }

          final statusColor = _statusColor(order.status);

          return RefreshIndicator(
            onRefresh: () => orderProvider.loadOrderDetail(widget.orderId).then((_) {}),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Card
                  Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 3,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: statusColor.withAlpha(30),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              order.isDraft ? Icons.edit_note : Icons.receipt_long,
                              color: statusColor,
                              size: 30,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Order #${order.id.length > 8 ? order.id.substring(0, 8) : order.id}",
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: statusColor.withAlpha(30),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    order.status.toUpperCase(),
                                    style: TextStyle(
                                      color: statusColor,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (order.totalAmount > 0)
                            Text(
                              "₹${order.totalAmount.toStringAsFixed(2)}",
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.mossGreen,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Event Details Card
                  if (order.eventDate != null || order.eventType != null || order.guestCount != null)
                    Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Event Details",
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            const Divider(),
                            if (order.eventType != null)
                              _buildDetailRow(Icons.event, "Type", order.eventType!),
                            if (order.eventDate != null)
                              _buildDetailRow(Icons.calendar_today, "Date", order.eventDate!),
                            if (order.eventTime != null)
                              _buildDetailRow(Icons.access_time, "Time", order.eventTime!),
                            if (order.guestCount != null)
                              _buildDetailRow(Icons.people, "Guests", order.guestCount.toString()),
                            if (order.venueAddress != null)
                              _buildDetailRow(Icons.location_on, "Venue", order.venueAddress!),
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 16),

                  // Order Items Card
                  if (order.items.isNotEmpty)
                    Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Items (${order.items.length})",
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            const Divider(),
                            ...order.items.map((item) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 6),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item.menuItemName ?? 'Item ${item.id.length > 8 ? item.id.substring(0, 8) : item.id}',
                                          style: const TextStyle(fontSize: 14),
                                        ),
                                      ),
                                      Text(
                                        "×${item.quantity}",
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: Colors.grey,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      if (item.totalPrice > 0)
                                        Text(
                                          "₹${item.totalPrice.toStringAsFixed(2)}",
                                          style: const TextStyle(fontWeight: FontWeight.bold),
                                        ),
                                    ],
                                  ),
                                )),
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 16),

                  // Created At
                  if (order.createdAt != null)
                    Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: _buildDetailRow(
                          Icons.history,
                          "Created",
                          "${order.createdAt!.day}/${order.createdAt!.month}/${order.createdAt!.year} at ${order.createdAt!.hour.toString().padLeft(2, '0')}:${order.createdAt!.minute.toString().padLeft(2, '0')}",
                        ),
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Draft Actions
                  if (order.isDraft)
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _showCancelDialog(context, order),
                            icon: const Icon(Icons.close),
                            label: const Text("Cancel Order"),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: const BorderSide(color: Colors.red),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _showEditDialog(context, order),
                            icon: const Icon(Icons.edit),
                            label: const Text("Edit Order"),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.mossGreen,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                  const SizedBox(height: 30),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.mossGreen),
          const SizedBox(width: 10),
          SizedBox(
            width: 70,
            child: Text(
              label,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
