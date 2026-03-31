// lib/screens/search_screen.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:async';
import '../models/app_models.dart';
import '../services/api_service.dart';
import 'restaurant_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  List<Category> _categories = [];
  List<MenuItem> _menuItems = [];
  bool _hasSearched = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String val) {
    _debounce?.cancel();
    if (val.length < 2) {
      setState(() { _categories = []; _menuItems = []; _hasSearched = false; });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 500), () => _search(val));
  }

  Future<void> _search(String query) async {
    setState(() => _isLoading = true);
    final result = await ApiService.search(query);
    if (mounted) {
      setState(() {
        _categories = (result['categories'] as List? ?? []).map((e) => Category.fromJson(e)).toList();
        _menuItems = (result['menuItems'] as List? ?? []).map((e) => MenuItem.fromJson(e)).toList();
        _hasSearched = true;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          title: TextField(
            controller: _ctrl,
            onChanged: _onChanged,
            autofocus: true,
            textDirection: TextDirection.rtl,
            decoration: InputDecoration(
              hintText: 'ابحث عن منتجات، تصنيفات...',
              hintStyle: const TextStyle(color: Colors.grey),
              border: InputBorder.none,
              suffixIcon: _ctrl.text.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear, color: Colors.grey), onPressed: () { _ctrl.clear(); setState(() { _categories = []; _menuItems = []; _hasSearched = false; }); })
                  : const Icon(Icons.search, color: Colors.grey),
            ),
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFE53935)))
            : !_hasSearched
                ? _buildSuggestions()
                : _categories.isEmpty && _menuItems.isEmpty
                    ? _buildNoResults()
                    : _buildResults(),
      ),
    );
  }

  Widget _buildSuggestions() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.search, size: 80, color: Colors.grey),
        const SizedBox(height: 16),
        const Text('ابحث عن منتجاتك', style: TextStyle(fontSize: 18, color: Colors.grey)),
        const SizedBox(height: 8),
        const Text('اكتب اسم المنتج أو التصنيف', style: TextStyle(color: Colors.grey, fontSize: 14)),
      ]),
    );
  }

  Widget _buildNoResults() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.search_off, size: 80, color: Colors.grey),
        const SizedBox(height: 16),
        Text('لا نتائج لـ "${_ctrl.text}"', style: const TextStyle(fontSize: 18, color: Colors.grey)),
        const SizedBox(height: 8),
        const Text('جرب كلمة بحث أخرى', style: TextStyle(color: Colors.grey, fontSize: 14)),
      ]),
    );
  }

  Widget _buildResults() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_categories.isNotEmpty) ...[
          const Text('التصنيفات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ..._categories.map(_buildCategoryItem),
          const SizedBox(height: 16),
        ],
        if (_menuItems.isNotEmpty) ...[
          const Text('المنتجات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          ..._menuItems.map(_buildMenuItemCard),
        ],
      ],
    );
  }

  Widget _buildCategoryItem(Category cat) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: const Color(0xFFE53935).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: cat.image != null && cat.image!.isNotEmpty
              ? ClipRRect(borderRadius: BorderRadius.circular(10), child: CachedNetworkImage(imageUrl: cat.image!, fit: BoxFit.cover))
              : const Icon(Icons.category, color: Color(0xFFE53935)),
        ),
        const SizedBox(width: 12),
        Text(cat.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const Spacer(),
        const Icon(Icons.chevron_left, color: Colors.grey, size: 18),
      ]),
    );
  }

  Widget _buildMenuItemCard(MenuItem item) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => RestaurantScreen(restaurantId: item.restaurantId, restaurantName: item.restaurantName ?? ''))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: item.image != null && item.image!.isNotEmpty
                ? CachedNetworkImage(imageUrl: item.image!, width: 60, height: 60, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(width: 60, height: 60, color: Colors.grey.shade100, child: const Icon(Icons.fastfood, color: Colors.grey)))
                : Container(width: 60, height: 60, color: Colors.grey.shade100, child: const Icon(Icons.fastfood, color: Colors.grey)),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            if (item.description != null) Text(item.description!, style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text('${item.price.toStringAsFixed(2)} ر.س', style: const TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.bold)),
          ])),
          const Icon(Icons.chevron_left, color: Colors.grey, size: 18),
        ]),
      ),
    );
  }
}
