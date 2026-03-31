// lib/providers/cart_provider.dart
import 'package:flutter/foundation.dart';
import '../models/app_models.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  String? _restaurantId;
  String? _restaurantName;

  List<CartItem> get items => List.unmodifiable(_items);
  int get itemCount => _items.fold(0, (sum, i) => sum + i.quantity);
  bool get isEmpty => _items.isEmpty;
  String? get restaurantId => _restaurantId;
  String? get restaurantName => _restaurantName;

  double get subtotal => _items.fold(0, (sum, i) => sum + i.total);

  void addItem(MenuItem item, String restaurantId, String restaurantName) {
    if (_restaurantId != null && _restaurantId != restaurantId) {
      _items.clear();
    }
    _restaurantId = restaurantId;
    _restaurantName = restaurantName;

    final idx = _items.indexWhere((i) => i.item.id == item.id);
    if (idx >= 0) {
      _items[idx].quantity++;
    } else {
      _items.add(CartItem(item: item, quantity: 1, restaurantId: restaurantId, restaurantName: restaurantName));
    }
    notifyListeners();
  }

  void removeItem(String itemId) {
    _items.removeWhere((i) => i.item.id == itemId);
    if (_items.isEmpty) {
      _restaurantId = null;
      _restaurantName = null;
    }
    notifyListeners();
  }

  void decreaseItem(String itemId) {
    final idx = _items.indexWhere((i) => i.item.id == itemId);
    if (idx >= 0) {
      if (_items[idx].quantity > 1) {
        _items[idx].quantity--;
      } else {
        _items.removeAt(idx);
      }
      if (_items.isEmpty) {
        _restaurantId = null;
        _restaurantName = null;
      }
      notifyListeners();
    }
  }

  int getQuantity(String itemId) {
    final idx = _items.indexWhere((i) => i.item.id == itemId);
    return idx >= 0 ? _items[idx].quantity : 0;
  }

  void clear() {
    _items.clear();
    _restaurantId = null;
    _restaurantName = null;
    notifyListeners();
  }

  List<Map<String, dynamic>> toOrderItems() {
    return _items.map((i) => i.toOrderItem().toJson()).toList();
  }
}
