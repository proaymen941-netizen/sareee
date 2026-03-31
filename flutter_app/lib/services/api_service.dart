// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/app_models.dart';
import '../utils/constants.dart';

class ApiService {
  static final String _base = AppConstants.serverBaseUrl;

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // ===== UI Settings =====
  static Future<UiSettings> getUiSettings() async {
    try {
      final res = await http.get(Uri.parse('$_base/api/admin/ui-settings'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final settings = data is List ? data : (data['settings'] ?? []);
        return UiSettings.fromList(settings as List<dynamic>);
      }
    } catch (_) {}
    return const UiSettings();
  }

  // ===== Categories =====
  static Future<List<Category>> getCategories() async {
    try {
      final res = await http.get(Uri.parse('$_base/api/categories'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((e) => Category.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  // ===== Restaurants =====
  static Future<List<Restaurant>> getRestaurants({String? categoryId, String? search}) async {
    try {
      String url = '$_base/api/restaurants';
      final params = <String, String>{};
      if (categoryId != null && categoryId != 'all') params['categoryId'] = categoryId;
      if (search != null && search.isNotEmpty) params['search'] = search;
      if (params.isNotEmpty) url += '?' + params.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
      final res = await http.get(Uri.parse(url), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((e) => Restaurant.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  static Future<Restaurant?> getRestaurant(String id) async {
    try {
      final res = await http.get(Uri.parse('$_base/api/restaurants/$id'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return Restaurant.fromJson(jsonDecode(res.body));
    } catch (_) {}
    return null;
  }

  static Future<List<MenuItem>> getRestaurantMenu(String restaurantId) async {
    try {
      final res = await http.get(Uri.parse('$_base/api/restaurants/$restaurantId/menu'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final items = data['allItems'] ?? data['menu'] ?? data;
        if (items is List) return items.map((e) => MenuItem.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  // ===== Special Offers =====
  static Future<List<SpecialOffer>> getSpecialOffers() async {
    try {
      final res = await http.get(Uri.parse('$_base/api/special-offers'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((e) => SpecialOffer.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  // ===== Search =====
  static Future<Map<String, dynamic>> search(String query) async {
    try {
      final res = await http.get(Uri.parse('$_base/api/search?q=${Uri.encodeComponent(query)}'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (_) {}
    return {'categories': [], 'menuItems': [], 'restaurants': []};
  }

  // ===== Orders =====
  static Future<List<Order>> getOrdersByPhone(String phone) async {
    try {
      final res = await http.get(Uri.parse('$_base/api/orders/customer/${Uri.encodeComponent(phone)}'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((e) => Order.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  static Future<Order?> getOrder(String id) async {
    try {
      final res = await http.get(Uri.parse('$_base/api/orders/$id'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return Order.fromJson(jsonDecode(res.body));
    } catch (_) {}
    return null;
  }

  static Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/orders'),
        headers: _headers,
        body: jsonEncode(orderData),
      ).timeout(const Duration(seconds: 15));
      final data = jsonDecode(res.body);
      return {'success': res.statusCode == 200 || res.statusCode == 201, ...data};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال بالخادم'};
    }
  }

  // ===== Auth =====
  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/auth/login'),
        headers: _headers,
        body: jsonEncode({'identifier': identifier, 'password': password}),
      ).timeout(const Duration(seconds: 10));
      final data = jsonDecode(res.body);
      return {'success': res.statusCode == 200, ...data};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال'};
    }
  }

  static Future<Map<String, dynamic>> register(String name, String phone, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/auth/register'),
        headers: _headers,
        body: jsonEncode({'name': name, 'phone': phone, 'password': password, 'username': phone}),
      ).timeout(const Duration(seconds: 10));
      final data = jsonDecode(res.body);
      return {'success': res.statusCode == 200 || res.statusCode == 201, ...data};
    } catch (e) {
      return {'success': false, 'message': 'خطأ في الاتصال'};
    }
  }

  static Future<Map<String, dynamic>> guestAuth(String name, String phone) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/customers/auth'),
        headers: _headers,
        body: jsonEncode({'name': name, 'phone': phone}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return {'success': true, ...data};
      }
    } catch (_) {}
    return {'success': false, 'message': 'خطأ في الاتصال'};
  }

  // ===== Favorites =====
  static Future<List<MenuItem>> getFavorites(String userId) async {
    try {
      final res = await http.get(Uri.parse('$_base/api/favorites/products/$userId'), headers: _headers).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((e) => MenuItem.fromJson(e)).toList();
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> toggleFavorite(String userId, String itemId) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/favorites/products/toggle'),
        headers: _headers,
        body: jsonEncode({'userId': userId, 'itemId': itemId}),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (_) {}
    return false;
  }

  // ===== Delivery Fee =====
  static Future<double> calculateDeliveryFee({double? distance, double? lat, double? lng}) async {
    try {
      final body = <String, dynamic>{};
      if (distance != null) body['distance'] = distance;
      if (lat != null) body['lat'] = lat;
      if (lng != null) body['lng'] = lng;
      final res = await http.post(
        Uri.parse('$_base/api/delivery-fee/calculate'),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return (data['fee'] as num?)?.toDouble() ?? 5.0;
      }
    } catch (_) {}
    return 5.0;
  }
}
