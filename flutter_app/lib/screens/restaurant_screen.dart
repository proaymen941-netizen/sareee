// lib/screens/restaurant_screen.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../providers/cart_provider.dart';
import 'cart_screen.dart';

class RestaurantScreen extends StatefulWidget {
  final String restaurantId;
  final String restaurantName;

  const RestaurantScreen({super.key, required this.restaurantId, required this.restaurantName});

  @override
  State<RestaurantScreen> createState() => _RestaurantScreenState();
}

class _RestaurantScreenState extends State<RestaurantScreen> {
  Restaurant? _restaurant;
  List<MenuItem> _menuItems = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        ApiService.getRestaurant(widget.restaurantId),
        ApiService.getRestaurantMenu(widget.restaurantId),
      ]);
      if (mounted) {
        setState(() {
          _restaurant = results[0] as Restaurant?;
          _menuItems = results[1] as List<MenuItem>;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = context.watch<CartProvider>().itemCount;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFE53935)))
            : CustomScrollView(
                slivers: [
                  SliverAppBar(
                    expandedHeight: 200,
                    pinned: true,
                    backgroundColor: Colors.white,
                    leading: IconButton(
                      icon: const Icon(Icons.arrow_back_ios),
                      onPressed: () => Navigator.pop(context),
                    ),
                    actions: [
                      Stack(children: [
                        IconButton(
                          icon: const Icon(Icons.shopping_cart_outlined),
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
                        ),
                        if (cartCount > 0)
                          Positioned(right: 8, top: 8, child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Color(0xFFE53935), shape: BoxShape.circle),
                            child: Text('$cartCount', style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                          )),
                      ]),
                    ],
                    flexibleSpace: FlexibleSpaceBar(
                      background: _restaurant?.image != null && _restaurant!.image!.isNotEmpty
                          ? CachedNetworkImage(imageUrl: _restaurant!.image!, fit: BoxFit.cover, errorWidget: (_, __, ___) => _buildPlaceholder())
                          : _buildPlaceholder(),
                    ),
                  ),
                  if (_restaurant != null)
                    SliverToBoxAdapter(child: _buildRestaurantInfo()),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Text('المنتجات', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  _buildMenuList(),
                  const SliverToBoxAdapter(child: SizedBox(height: 100)),
                ],
              ),
        bottomNavigationBar: cartCount > 0 ? _buildCartBar(context) : null,
      ),
    );
  }

  Widget _buildPlaceholder() => Container(
    color: const Color(0xFFE53935).withOpacity(0.1),
    child: const Center(child: Icon(Icons.store, size: 60, color: Color(0xFFE53935))),
  );

  Widget _buildRestaurantInfo() {
    final r = _restaurant!;
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(r.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: r.isOpen ? const Color(0xFF4CAF50) : Colors.red, borderRadius: BorderRadius.circular(12)),
            child: Text(r.isOpen ? 'مفتوح' : 'مغلق', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ]),
        if (r.description != null) ...[const SizedBox(height: 8), Text(r.description!, style: const TextStyle(color: Colors.grey, fontSize: 14))],
        const SizedBox(height: 12),
        Row(children: [
          _infoChip(Icons.star, Colors.amber, '${r.rating.toStringAsFixed(1)}'),
          const SizedBox(width: 12),
          _infoChip(Icons.access_time, Colors.blue, '${r.deliveryTime} دق'),
          const SizedBox(width: 12),
          _infoChip(Icons.delivery_dining, Colors.green, r.deliveryFee == 0 ? 'مجاني' : '${r.deliveryFee.toStringAsFixed(0)} ر.س'),
          if (r.minimumOrder > 0) ...[const SizedBox(width: 12), _infoChip(Icons.shopping_bag, Colors.orange, 'أدنى ${r.minimumOrder.toStringAsFixed(0)} ر.س')],
        ]),
      ]),
    );
  }

  Widget _infoChip(IconData icon, Color color, String text) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 14, color: color),
      const SizedBox(width: 3),
      Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
    ]);
  }

  Widget _buildMenuList() {
    if (_menuItems.isEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(40),
            child: Column(children: [
              const Icon(Icons.fastfood_outlined, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              const Text('لا توجد منتجات', style: TextStyle(color: Colors.grey, fontSize: 16)),
            ]),
          ),
        ),
      );
    }
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (ctx, i) => _buildMenuItem(_menuItems[i]),
        childCount: _menuItems.length,
      ),
    );
  }

  Widget _buildMenuItem(MenuItem item) {
    final cart = context.watch<CartProvider>();
    final qty = cart.getQuantity(item.id);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6)]),
      child: Row(children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: item.image != null && item.image!.isNotEmpty
              ? CachedNetworkImage(imageUrl: item.image!, width: 80, height: 80, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(width: 80, height: 80, color: Colors.grey.shade200, child: const Icon(Icons.fastfood, color: Colors.grey)))
              : Container(width: 80, height: 80, color: Colors.grey.shade100, child: const Icon(Icons.fastfood, color: Colors.grey)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            if (item.description != null) ...[
              const SizedBox(height: 3),
              Text(item.description!, style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 6),
            Row(children: [
              Text('${item.price.toStringAsFixed(2)} ر.س', style: const TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.bold, fontSize: 14)),
              if (item.oldPrice != null) ...[
                const SizedBox(width: 6),
                Text('${item.oldPrice!.toStringAsFixed(2)} ر.س', style: const TextStyle(color: Colors.grey, fontSize: 11, decoration: TextDecoration.lineThrough)),
              ],
            ]),
          ]),
        ),
        const SizedBox(width: 8),
        qty == 0
            ? GestureDetector(
                onTap: () => _addToCart(item),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Color(0xFFE53935), shape: BoxShape.circle),
                  child: const Icon(Icons.add, color: Colors.white, size: 18),
                ),
              )
            : Row(mainAxisSize: MainAxisSize.min, children: [
                GestureDetector(
                  onTap: () => context.read<CartProvider>().decreaseItem(item.id),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(color: Colors.grey.shade200, shape: BoxShape.circle),
                    child: const Icon(Icons.remove, size: 16),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
                GestureDetector(
                  onTap: () => _addToCart(item),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(color: Color(0xFFE53935), shape: BoxShape.circle),
                    child: const Icon(Icons.add, color: Colors.white, size: 16),
                  ),
                ),
              ]),
      ]),
    );
  }

  void _addToCart(MenuItem item) {
    final cart = context.read<CartProvider>();
    if (cart.restaurantId != null && cart.restaurantId != widget.restaurantId) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('تغيير المتجر'),
          content: const Text('سيتم مسح سلة التسوق الحالية. هل تريد المتابعة؟'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE53935)),
              onPressed: () {
                cart.clear();
                cart.addItem(item, widget.restaurantId, _restaurant?.name ?? widget.restaurantName);
                Navigator.pop(context);
              },
              child: const Text('متابعة', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } else {
      cart.addItem(item, widget.restaurantId, _restaurant?.name ?? widget.restaurantName);
    }
  }

  Widget _buildCartBar(BuildContext context) {
    final cart = context.watch<CartProvider>();
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      decoration: const BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, -2))]),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE53935),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.3), borderRadius: BorderRadius.circular(10)),
            child: Text('${cart.itemCount}', style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 8),
          const Text('عرض سلة التسوق', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          const Spacer(),
          Text('${cart.subtotal.toStringAsFixed(2)} ر.س', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        ]),
      ),
    );
  }
}
