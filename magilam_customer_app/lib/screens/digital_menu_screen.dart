import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../theme.dart';
import '../providers/menu_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/category_bubble.dart';
import '../widgets/menu_item_card.dart';
import '../widgets/quick_quotation_bar.dart';
import '../widgets/ingredient_popup.dart';

class DigitalMenuScreen extends StatefulWidget {
  const DigitalMenuScreen({super.key});

  @override
  State<DigitalMenuScreen> createState() => _DigitalMenuScreenState();
}

class _DigitalMenuScreenState extends State<DigitalMenuScreen>
    with TickerProviderStateMixin {
  late AnimationController _cartBounceController;
  late Animation<double> _cartBounceAnimation;

  @override
  void initState() {
    super.initState();

    // Cart bounce animation
    _cartBounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _cartBounceAnimation = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.35), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 1.35, end: 0.9), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 0.9, end: 1.0), weight: 40),
    ]).animate(CurvedAnimation(
      parent: _cartBounceController,
      curve: Curves.easeOutCubic,
    ));

    // Load data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final menuProvider = context.read<MenuProvider>();
      menuProvider.loadCategories();
      menuProvider.loadMenuItems();
    });
  }

  @override
  void dispose() {
    _cartBounceController.dispose();
    super.dispose();
  }

  void _triggerCartBounce() {
    _cartBounceController.reset();
    _cartBounceController.forward();
  }

  void _showCartSheet() {
    final cartProvider = context.read<CartProvider>();
    if (cartProvider.itemCount == 0) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) {
        return Consumer<CartProvider>(
          builder: (context, cart, _) {
            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.65,
              ),
              decoration: const BoxDecoration(
                color: AppColors.sandalBeigeLight,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.dividerColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Row(
                      children: [
                        const Icon(Icons.shopping_bag_rounded,
                            color: AppColors.orangeAccent, size: 24),
                        const SizedBox(width: 10),
                        Text(
                          'Your Cart (${cart.totalQuantity} items)',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                          ),
                        ),
                        const Spacer(),
                        if (cart.itemCount > 0)
                          TextButton(
                            onPressed: () {
                              cart.clearCart();
                              Navigator.pop(context);
                            },
                            child: const Text(
                              'Clear',
                              style: TextStyle(
                                color: AppColors.orangeAccent,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),

                  const Divider(color: AppColors.dividerColor, height: 16),

                  // Cart items list
                  Flexible(
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
                      shrinkWrap: true,
                      itemCount: cart.cartItems.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final cartItem = cart.cartItems[index];
                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceWhite,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      cartItem.menuItem.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                        color: AppColors.textDark,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '₹${cartItem.menuItem.pricePerUnit.toStringAsFixed(0)}/${cartItem.menuItem.baseUnit}',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.orangeAccent,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Quantity controls
                              Container(
                                decoration: BoxDecoration(
                                  color: AppColors.sandalBeige,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove, size: 18),
                                      onPressed: () => cart.removeItem(cartItem.menuItem.id),
                                      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                                      padding: EdgeInsets.zero,
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 4),
                                      child: Text(
                                        '${cartItem.quantity}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 15,
                                        ),
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.add, size: 18),
                                      onPressed: () => cart.addItem(cartItem.menuItem),
                                      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                                      padding: EdgeInsets.zero,
                                    ),
                                  ],
                                ),
                              ),
                              // Subtotal
                              SizedBox(
                                width: 60,
                                child: Text(
                                  '₹${(cartItem.quantity * cartItem.menuItem.pricePerUnit).toStringAsFixed(0)}',
                                  textAlign: TextAlign.right,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                    color: AppColors.textDark,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),

                  // Total + Proceed
                  Container(
                    padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
                    decoration: const BoxDecoration(
                      border: Border(top: BorderSide(color: AppColors.dividerColor)),
                    ),
                    child: Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Estimated Total',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            Text(
                              '₹${cart.estimatedTotal.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textDark,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('Proceeding to Date & Time Selection'),
                                backgroundColor: AppColors.mossGreen,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.mossGreen,
                            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text(
                            'Proceed →',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final menuProvider = context.watch<MenuProvider>();
    final cartProvider = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: AppColors.sandalBackground,
      body: SafeArea(
        child: Stack(
          children: [
            CustomScrollView(
              slivers: [
                // ─── Collapsed Header ─────────────────────────
                SliverAppBar(
                  floating: true,
                  snap: true,
                  backgroundColor: AppColors.sandalBackground,
                  elevation: 0,
                  toolbarHeight: 70,
                  title: Row(
                    children: [
                      // Logo / Brand
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.orangeAccent, AppColors.orangeLight],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.restaurant_menu,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Magilam Foods',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textDark,
                              ),
                            ),
                            Text(
                              'Catering Menu',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    // Animated cart icon — tappable
                    Padding(
                      padding: const EdgeInsets.only(right: 16),
                      child: GestureDetector(
                        onTap: _showCartSheet,
                        child: ScaleTransition(
                          scale: _cartBounceAnimation,
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                width: 46,
                                height: 46,
                                decoration: BoxDecoration(
                                  color: AppColors.orangeAccent.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(
                                  Icons.shopping_bag_rounded,
                                  color: AppColors.orangeAccent,
                                  size: 24,
                                ),
                              ),
                              if (cartProvider.itemCount > 0)
                                Positioned(
                                  top: -4,
                                  right: -4,
                                  child: Container(
                                    padding: const EdgeInsets.all(5),
                                    decoration: const BoxDecoration(
                                      color: AppColors.mossGreen,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      '${cartProvider.totalQuantity}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                // ─── Category Bubbles ─────────────────────────
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 56,
                    child: menuProvider.isLoadingCategories
                        ? _buildCategoryShimmer()
                        : ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: menuProvider.categories.length,
                            itemBuilder: (context, index) {
                              final category = menuProvider.categories[index];
                              return Padding(
                                padding: const EdgeInsets.only(right: 10),
                                child: CategoryBubble(
                                  label: category.name,
                                  isSelected: menuProvider.selectedCategoryId ==
                                      category.id,
                                  onTap: () =>
                                      menuProvider.selectCategory(category.id),
                                ),
                              );
                            },
                          ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 20)),

                // ─── Menu Grid ────────────────────────────────
                if (menuProvider.isLoadingItems)
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 0.68,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _buildCardShimmer(),
                        childCount: 6,
                      ),
                    ),
                  )
                else if (menuProvider.filteredItems.isEmpty)
                  SliverToBoxAdapter(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(60),
                        child: Column(
                          children: [
                            Icon(
                              Icons.restaurant_outlined,
                              size: 60,
                              color: AppColors.textSecondary.withOpacity(0.4),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'No items in this category',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 0.68,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final item = menuProvider.filteredItems[index];
                          return MenuItemCard(
                            item: item,
                            isInCart: cartProvider.isInCart(item.id),
                            quantity: cartProvider.getQuantity(item.id),
                            onAdd: () {
                              cartProvider.addItem(item);
                              _triggerCartBounce();
                            },
                            onRemove: () => cartProvider.removeItem(item.id),
                            onViewDetails: () {
                              menuProvider.loadIngredients(item.id);
                              IngredientPopup.show(
                                context,
                                itemName: item.name,
                                ingredients: menuProvider.ingredients,
                                isLoading: menuProvider.isLoadingIngredients,
                              );
                            },
                          );
                        },
                        childCount: menuProvider.filteredItems.length,
                      ),
                    ),
                  ),

                // Bottom padding for quotation bar
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: cartProvider.itemCount > 0 ? 110 : 30,
                  ),
                ),
              ],
            ),

            // ─── Quick Quotation Bar (Sticky Bottom) ──────────
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: QuickQuotationBar(
                itemCount: cartProvider.itemCount,
                totalQuantity: cartProvider.totalQuantity,
                estimatedTotal: cartProvider.estimatedTotal,
                onTap: _showCartSheet,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Shimmer Helpers ──────────────────────────────────────

  Widget _buildCategoryShimmer() {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(right: 10),
          child: Shimmer.fromColors(
            baseColor: AppColors.shimmerBase,
            highlightColor: AppColors.shimmerHighlight,
            child: Container(
              width: 90,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildCardShimmer() {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmerBase,
      highlightColor: AppColors.shimmerHighlight,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }
}
