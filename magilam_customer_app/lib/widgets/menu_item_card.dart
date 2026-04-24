import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme.dart';
import '../models/menu_item.dart';

class MenuItemCard extends StatefulWidget {
  final MenuItem item;
  final bool isInCart;
  final int quantity;
  final VoidCallback onAdd;
  final VoidCallback onRemove;
  final VoidCallback onViewDetails;

  const MenuItemCard({
    super.key,
    required this.item,
    required this.isInCart,
    required this.quantity,
    required this.onAdd,
    required this.onRemove,
    required this.onViewDetails,
  });

  @override
  State<MenuItemCard> createState() => _MenuItemCardState();
}

class _MenuItemCardState extends State<MenuItemCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _addController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _addController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.85).animate(
      CurvedAnimation(parent: _addController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _addController.dispose();
    super.dispose();
  }

  void _onAddTap() {
    HapticFeedback.lightImpact();
    _addController.forward().then((_) {
      _addController.reverse();
    });
    widget.onAdd();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.sandalBeige,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── Image Section ────────────────────────────────
          Expanded(
            flex: 5,
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: widget.item.imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: widget.item.imageUrl!,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: AppColors.shimmerBase,
                              child: const Center(
                                child: Icon(
                                  Icons.restaurant,
                                  size: 40,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              color: AppColors.shimmerBase,
                              child: const Center(
                                child: Icon(
                                  Icons.restaurant_menu,
                                  size: 40,
                                  color: AppColors.mossGreen,
                                ),
                              ),
                            ),
                          )
                        : Container(
                            color: AppColors.shimmerBase,
                            child: const Center(
                              child: Icon(
                                Icons.restaurant_menu,
                                size: 40,
                                color: AppColors.mossGreen,
                              ),
                            ),
                          ),
                  ),
                ),

                // "View Details" link
                Positioned(
                  top: 8,
                  left: 8,
                  child: GestureDetector(
                    onTap: widget.onViewDetails,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.55),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.info_outline, size: 14, color: Colors.white),
                          SizedBox(width: 4),
                          Text(
                            'View Details',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Quantity badge if in cart
                if (widget.isInCart)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.orangeAccent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'x${widget.quantity}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // ─── Info Section ─────────────────────────────────
          Expanded(
            flex: 4,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 8, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.item.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                      height: 1.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  // Price display
                  if (widget.item.pricePerUnit > 0)
                    Text(
                      '₹${widget.item.pricePerUnit.toStringAsFixed(0)}/${widget.item.baseUnit}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.orangeAccent,
                        height: 1.2,
                      ),
                    ),
                  const SizedBox(height: 2),
                  Expanded(
                    child: Text(
                      widget.item.description ?? '',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary.withOpacity(0.8),
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Unit info
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.mossGreen.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Min ${widget.item.minQuantity.toInt()} ${widget.item.baseUnit}',
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.mossGreen,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),

                      // Add/Remove buttons
                      widget.isInCart
                          ? Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildCircleButton(
                                  icon: Icons.remove,
                                  onTap: () {
                                    HapticFeedback.lightImpact();
                                    widget.onRemove();
                                  },
                                  color: AppColors.orangeAccent,
                                  size: 30,
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 6),
                                  child: Text(
                                    '${widget.quantity}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 15,
                                      color: AppColors.textDark,
                                    ),
                                  ),
                                ),
                                ScaleTransition(
                                  scale: _scaleAnimation,
                                  child: _buildCircleButton(
                                    icon: Icons.add,
                                    onTap: _onAddTap,
                                    color: AppColors.mossGreen,
                                    size: 30,
                                  ),
                                ),
                              ],
                            )
                          : ScaleTransition(
                              scale: _scaleAnimation,
                              child: _buildCircleButton(
                                icon: Icons.add,
                                onTap: _onAddTap,
                                color: AppColors.mossGreen,
                                size: 36,
                              ),
                            ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircleButton({
    required IconData icon,
    required VoidCallback onTap,
    required Color color,
    double size = 36,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.35),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: size * 0.5,
        ),
      ),
    );
  }
}
