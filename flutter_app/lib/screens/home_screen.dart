// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../providers/settings_provider.dart';
import '../providers/cart_provider.dart';
import 'restaurant_screen.dart';
import 'cart_screen.dart';
import 'search_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Category> _categories = [];
  List<Restaurant> _restaurants = [];
  List<SpecialOffer> _offers = [];
  String _selectedCategory = 'all';
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
        ApiService.getCategories(),
        ApiService.getRestaurants(),
        ApiService.getSpecialOffers(),
      ]);
      if (mounted) {
        setState(() {
          _categories = results[0] as List<Category>;
          _restaurants = results[1] as List<Restaurant>;
          _offers = results[2] as List<SpecialOffer>;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _filterByCategory(String categoryId) async {
    setState(() { _selectedCategory = categoryId; _isLoading = true; });
    final list = await ApiService.getRestaurants(categoryId: categoryId);
    if (mounted) setState(() { _restaurants = list; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>().settings;
    final cartCount = context.watch<CartProvider>().itemCount;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: RefreshIndicator(
          color: const Color(0xFFE53935),
          onRefresh: _loadData,
          child: CustomScrollView(
            slivers: [
              _buildAppBar(context, settings, cartCount),
              if (settings.storeStatus != 'open')
                SliverToBoxAdapter(child: _buildClosedBanner(settings)),
              if (settings.showSearchBar)
                SliverToBoxAdapter(child: _buildSearchBar(context)),
              if (settings.showCategories && _categories.isNotEmpty)
                SliverToBoxAdapter(child: _buildCategories()),
              if (settings.showSpecialOffers && _offers.isNotEmpty)
                SliverToBoxAdapter(child: _buildOffers()),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Row(children: [
                    const Text('المتاجر', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    Text('${_restaurants.length} متجر', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  ]),
                ),
              ),
              _buildRestaurantList(),
              const SliverToBoxAdapter(child: SizedBox(height: 80)),
            ],
          ),
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar(BuildContext context, UiSettings settings, int cartCount) {
    return SliverAppBar(
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0.5,
      title: Row(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFFE53935), Color(0xFF4CAF50)]),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(settings.appName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
        ),
      ]),
      actions: [
        if (settings.showSupportButton && settings.supportWhatsapp.isNotEmpty)
          IconButton(
            icon: const Icon(Icons.support_agent, color: Color(0xFF4CAF50)),
            onPressed: () => _launchWhatsApp(settings.supportWhatsapp),
          ),
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.shopping_cart_outlined, color: Colors.black87),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
            ),
            if (cartCount > 0)
              Positioned(
                right: 8, top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Color(0xFFE53935), shape: BoxShape.circle),
                  child: Text('$cartCount', style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                ),
              ),
          ],
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _buildClosedBanner(UiSettings settings) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        border: Border.all(color: Colors.orange.shade200),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        Icon(Icons.access_time, color: Colors.orange.shade700),
        const SizedBox(width: 8),
        Expanded(child: Text(
          'المتجر مغلق حالياً - ساعات العمل: ${settings.openingTime} - ${settings.closingTime}',
          style: TextStyle(color: Colors.orange.shade800, fontSize: 13),
        )),
      ]),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchScreen())),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 6, offset: const Offset(0, 2))],
        ),
        child: Row(children: [
          const Icon(Icons.search, color: Colors.grey),
          const SizedBox(width: 8),
          const Text('ما الذي تبحث عنه؟', style: TextStyle(color: Colors.grey, fontSize: 15)),
        ]),
      ),
    );
  }

  Widget _buildCategories() {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemCount: _categories.length + 1,
        itemBuilder: (ctx, i) {
          if (i == 0) {
            final isSelected = _selectedCategory == 'all';
            return GestureDetector(
              onTap: () => _filterByCategory('all'),
              child: _buildCategoryItem('الكل', null, isSelected),
            );
          }
          final cat = _categories[i - 1];
          final isSelected = _selectedCategory == cat.id;
          return GestureDetector(
            onTap: () => _filterByCategory(cat.id),
            child: _buildCategoryItem(cat.name, cat.image, isSelected),
          );
        },
      ),
    );
  }

  Widget _buildCategoryItem(String name, String? image, bool isSelected) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFE53935).withOpacity(0.1) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isSelected ? const Color(0xFFE53935) : Colors.grey.shade200, width: isSelected ? 2 : 1),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
            ),
            child: image != null && image.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: CachedNetworkImage(imageUrl: image, fit: BoxFit.cover, errorWidget: (_, __, ___) => const Icon(Icons.category, color: Colors.grey)),
                  )
                : const Icon(Icons.grid_view, color: Colors.grey),
          ),
          const SizedBox(height: 4),
          Text(name, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: isSelected ? const Color(0xFFE53935) : Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildOffers() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text('العروض الخاصة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        SizedBox(
          height: 160,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _offers.length,
            itemBuilder: (ctx, i) {
              final offer = _offers[i];
              return Container(
                width: 280,
                margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(colors: [Color(0xFFE53935), Color(0xFFFF7043)]),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(children: [
                    if (offer.image != null && offer.image!.isNotEmpty)
                      Positioned.fill(child: CachedNetworkImage(imageUrl: offer.image!, fit: BoxFit.cover, color: Colors.black.withOpacity(0.3), colorBlendMode: BlendMode.darken)),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(offer.title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          if (offer.description != null)
                            Text(offer.description!, style: const TextStyle(color: Colors.white70, fontSize: 12), maxLines: 2),
                        ],
                      ),
                    ),
                  ]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildRestaurantList() {
    if (_isLoading) {
      return SliverList(
        delegate: SliverChildBuilderDelegate(
          (ctx, i) => _buildShimmerCard(),
          childCount: 4,
        ),
      );
    }
    if (_restaurants.isEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(40),
            child: Column(children: [
              const Icon(Icons.store_outlined, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              const Text('لا توجد متاجر', style: TextStyle(fontSize: 18, color: Colors.grey)),
            ]),
          ),
        ),
      );
    }
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (ctx, i) => _buildRestaurantCard(_restaurants[i]),
        childCount: _restaurants.length,
      ),
    );
  }

  Widget _buildRestaurantCard(Restaurant r) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => RestaurantScreen(restaurantId: r.id, restaurantName: r.name)),
      ),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: r.image != null && r.image!.isNotEmpty
                    ? CachedNetworkImage(imageUrl: r.image!, height: 140, width: double.infinity, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(height: 140, color: Colors.grey.shade200, child: const Icon(Icons.store, size: 48, color: Colors.grey)))
                    : Container(height: 140, color: Colors.grey.shade200, child: const Icon(Icons.store, size: 48, color: Colors.grey)),
              ),
              Positioned(top: 12, left: 12, child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: r.isOpen ? const Color(0xFF4CAF50) : Colors.red, borderRadius: BorderRadius.circular(12)),
                child: Text(r.isOpen ? 'مفتوح' : 'مغلق', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              )),
            ]),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(r.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                if (r.description != null) ...[
                  const SizedBox(height: 4),
                  Text(r.description!, style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
                const SizedBox(height: 8),
                Row(children: [
                  const Icon(Icons.star, color: Colors.amber, size: 16),
                  const SizedBox(width: 2),
                  Text(r.rating.toStringAsFixed(1), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(width: 12),
                  const Icon(Icons.access_time, color: Colors.grey, size: 14),
                  const SizedBox(width: 2),
                  Text('${r.deliveryTime} دقيقة', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(width: 12),
                  const Icon(Icons.delivery_dining, color: Colors.grey, size: 14),
                  const SizedBox(width: 2),
                  Text(r.deliveryFee == 0 ? 'توصيل مجاني' : '${r.deliveryFee.toStringAsFixed(0)} ر.س', style: TextStyle(fontSize: 12, color: r.deliveryFee == 0 ? const Color(0xFF4CAF50) : Colors.grey)),
                ]),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      height: 220,
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
    );
  }

  void _launchWhatsApp(String phone) async {
    final url = 'https://wa.me/${phone.replaceAll('+', '').replaceAll(' ', '')}';
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
