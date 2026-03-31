// lib/screens/favorites_screen.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import 'login_screen.dart';
import 'restaurant_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<MenuItem> _favorites = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;
    setState(() => _isLoading = true);
    final items = await ApiService.getFavorites(user.id);
    if (mounted) setState(() { _favorites = items; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          title: const Text('المفضلة', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        ),
        body: user == null
            ? _buildNotLoggedIn()
            : _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFE53935)))
                : _favorites.isEmpty
                    ? _buildEmpty()
                    : RefreshIndicator(
                        onRefresh: _loadFavorites,
                        color: const Color(0xFFE53935),
                        child: GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.75,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: _favorites.length,
                          itemBuilder: (ctx, i) => _buildFavoriteCard(_favorites[i]),
                        ),
                      ),
      ),
    );
  }

  Widget _buildNotLoggedIn() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.favorite_outline, size: 80, color: Colors.grey),
        const SizedBox(height: 16),
        const Text('سجّل دخولك لعرض المفضلة', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('احفظ منتجاتك المفضلة للوصول إليها بسرعة', style: TextStyle(color: Colors.grey, fontSize: 14)),
        const SizedBox(height: 24),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE53935), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14)),
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())).then((_) => _loadFavorites()),
          child: const Text('تسجيل الدخول'),
        ),
      ]),
    );
  }

  Widget _buildEmpty() {
    return RefreshIndicator(
      onRefresh: _loadFavorites,
      color: const Color(0xFFE53935),
      child: ListView(children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.6,
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Icon(Icons.favorite_outline, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('لا توجد مفضلات', style: TextStyle(fontSize: 18, color: Colors.grey)),
            const SizedBox(height: 8),
            const Text('أضف منتجاتك المفضلة من المتاجر', style: TextStyle(color: Colors.grey, fontSize: 14)),
          ]),
        ),
      ]),
    );
  }

  Widget _buildFavoriteCard(MenuItem item) {
    final cart = context.watch<CartProvider>();
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => RestaurantScreen(restaurantId: item.restaurantId, restaurantName: item.restaurantName ?? ''))),
      child: Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Stack(children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: item.image != null && item.image!.isNotEmpty
                    ? CachedNetworkImage(imageUrl: item.image!, width: double.infinity, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: Colors.grey.shade100, child: const Icon(Icons.fastfood, color: Colors.grey, size: 40)))
                    : Container(color: Colors.grey.shade100, child: const Icon(Icons.fastfood, color: Colors.grey, size: 40)),
              ),
              Positioned(top: 8, left: 8, child: GestureDetector(
                onTap: () async {
                  final user = context.read<AuthProvider>().user;
                  if (user != null) {
                    await ApiService.toggleFavorite(user.id, item.id);
                    _loadFavorites();
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)]),
                  child: const Icon(Icons.favorite, color: Color(0xFFE53935), size: 18),
                ),
              )),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
              if (item.restaurantName != null)
                Text(item.restaurantName!, style: const TextStyle(color: Colors.grey, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 6),
              Row(children: [
                Text('${item.price.toStringAsFixed(2)} ر.س', style: const TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.bold, fontSize: 13)),
                const Spacer(),
                GestureDetector(
                  onTap: () => cart.addItem(item, item.restaurantId, item.restaurantName ?? ''),
                  child: Container(
                    padding: const EdgeInsets.all(5),
                    decoration: const BoxDecoration(color: Color(0xFFE53935), shape: BoxShape.circle),
                    child: const Icon(Icons.add, color: Colors.white, size: 14),
                  ),
                ),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}
