// lib/models/app_models.dart
import 'dart:convert';

class Category {
  final String id;
  final String name;
  final String? icon;
  final String? image;
  final String? description;
  final bool isActive;

  Category({required this.id, required this.name, this.icon, this.image, this.description, this.isActive = true});

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id']?.toString() ?? '',
    name: json['name'] ?? '',
    icon: json['icon'],
    image: json['image'],
    description: json['description'],
    isActive: json['isActive'] ?? true,
  );
}

class Restaurant {
  final String id;
  final String name;
  final String? description;
  final String? image;
  final String? logo;
  final String? address;
  final String? phone;
  final String? categoryId;
  final double rating;
  final int deliveryTime;
  final double deliveryFee;
  final double minimumOrder;
  final bool isOpen;
  final bool isActive;

  Restaurant({required this.id, required this.name, this.description, this.image, this.logo, this.address, this.phone, this.categoryId, this.rating = 0, this.deliveryTime = 30, this.deliveryFee = 0, this.minimumOrder = 0, this.isOpen = true, this.isActive = true});

  factory Restaurant.fromJson(Map<String, dynamic> json) => Restaurant(
    id: json['id']?.toString() ?? '',
    name: json['name'] ?? '',
    description: json['description'],
    image: json['image'],
    logo: json['logo'],
    address: json['address'],
    phone: json['phone'],
    categoryId: json['categoryId']?.toString(),
    rating: (json['rating'] as num?)?.toDouble() ?? 0,
    deliveryTime: (json['deliveryTime'] as num?)?.toInt() ?? 30,
    deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0,
    minimumOrder: (json['minimumOrder'] as num?)?.toDouble() ?? 0,
    isOpen: json['isOpen'] ?? true,
    isActive: json['isActive'] ?? true,
  );
}

class MenuItem {
  final String id;
  final String name;
  final String? description;
  final double price;
  final double? oldPrice;
  final String? image;
  final String restaurantId;
  final String? restaurantName;
  final String? categoryId;
  final bool isAvailable;
  final bool isFeatured;

  MenuItem({required this.id, required this.name, this.description, required this.price, this.oldPrice, this.image, required this.restaurantId, this.restaurantName, this.categoryId, this.isAvailable = true, this.isFeatured = false});

  factory MenuItem.fromJson(Map<String, dynamic> json) => MenuItem(
    id: json['id']?.toString() ?? '',
    name: json['name'] ?? '',
    description: json['description'],
    price: (json['price'] as num?)?.toDouble() ?? 0,
    oldPrice: (json['oldPrice'] as num?)?.toDouble(),
    image: json['image'],
    restaurantId: json['restaurantId']?.toString() ?? '',
    restaurantName: json['restaurantName'],
    categoryId: json['categoryId']?.toString(),
    isAvailable: json['isAvailable'] ?? true,
    isFeatured: json['isFeatured'] ?? false,
  );
}

class SpecialOffer {
  final String id;
  final String title;
  final String? description;
  final String? image;
  final bool isActive;

  SpecialOffer({required this.id, required this.title, this.description, this.image, this.isActive = true});

  factory SpecialOffer.fromJson(Map<String, dynamic> json) => SpecialOffer(
    id: json['id']?.toString() ?? '',
    title: json['title'] ?? '',
    description: json['description'],
    image: json['image'],
    isActive: json['isActive'] ?? true,
  );
}

class OrderItem {
  final String name;
  final int quantity;
  final double price;
  final String? restaurantId;
  final String? restaurantName;
  final String? image;

  OrderItem({required this.name, required this.quantity, required this.price, this.restaurantId, this.restaurantName, this.image});

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
    name: json['name'] ?? '',
    quantity: (json['quantity'] as num?)?.toInt() ?? 1,
    price: (json['price'] as num?)?.toDouble() ?? 0,
    restaurantId: json['restaurantId']?.toString(),
    restaurantName: json['restaurantName'],
    image: json['image'],
  );

  Map<String, dynamic> toJson() => {
    'name': name,
    'quantity': quantity,
    'price': price,
    if (restaurantId != null) 'restaurantId': restaurantId,
    if (restaurantName != null) 'restaurantName': restaurantName,
    if (image != null) 'image': image,
  };
}

class Order {
  final String id;
  final String orderNumber;
  final String customerName;
  final String customerPhone;
  final String deliveryAddress;
  final String? notes;
  final String paymentMethod;
  final List<OrderItem> items;
  final double subtotal;
  final double deliveryFee;
  final double total;
  final String status;
  final String? restaurantName;
  final String? driverName;
  final String? driverPhone;
  final String createdAt;
  final String? estimatedTime;
  final bool isRated;

  Order({required this.id, required this.orderNumber, required this.customerName, required this.customerPhone, required this.deliveryAddress, this.notes, required this.paymentMethod, required this.items, required this.subtotal, required this.deliveryFee, required this.total, required this.status, this.restaurantName, this.driverName, this.driverPhone, required this.createdAt, this.estimatedTime, this.isRated = false});

  factory Order.fromJson(Map<String, dynamic> json) {
    List<OrderItem> parsedItems = [];
    try {
      final rawItems = json['items'];
      List<dynamic> itemsList = [];
      if (rawItems is String) {
        itemsList = jsonDecode(rawItems) as List<dynamic>;
      } else if (rawItems is List) {
        itemsList = rawItems;
      }
      parsedItems = itemsList.map((i) => OrderItem.fromJson(i as Map<String, dynamic>)).toList();
    } catch (_) {}

    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber'] ?? '',
      customerName: json['customerName'] ?? '',
      customerPhone: json['customerPhone'] ?? '',
      deliveryAddress: json['deliveryAddress'] ?? '',
      notes: json['notes'],
      paymentMethod: json['paymentMethod'] ?? 'cash',
      items: parsedItems,
      subtotal: double.tryParse(json['subtotal']?.toString() ?? '0') ?? 0,
      deliveryFee: double.tryParse(json['deliveryFee']?.toString() ?? '0') ?? 0,
      total: double.tryParse(json['total']?.toString() ?? json['totalAmount']?.toString() ?? '0') ?? 0,
      status: json['status'] ?? 'pending',
      restaurantName: json['restaurantName'],
      driverName: json['driverName'],
      driverPhone: json['driverPhone'],
      createdAt: json['createdAt']?.toString() ?? '',
      estimatedTime: json['estimatedTime'],
      isRated: json['isRated'] ?? false,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'preparing': return 'جاري التحضير';
      case 'on_way': return 'في الطريق';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  }

  bool get isActive => ['pending', 'confirmed', 'preparing', 'on_way'].contains(status);
  bool get isCompleted => status == 'delivered';
  bool get isCancelled => status == 'cancelled';
}

class CartItem {
  final MenuItem item;
  int quantity;
  final String restaurantId;
  final String restaurantName;

  CartItem({required this.item, required this.quantity, required this.restaurantId, required this.restaurantName});

  double get total => item.price * quantity;

  OrderItem toOrderItem() => OrderItem(
    name: item.name,
    quantity: quantity,
    price: item.price,
    restaurantId: restaurantId,
    restaurantName: restaurantName,
    image: item.image,
  );
}

class AppUser {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String? address;
  final String role;

  AppUser({required this.id, required this.name, required this.phone, this.email, this.address, this.role = 'customer'});

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: json['id']?.toString() ?? '',
    name: json['name'] ?? '',
    phone: json['phone'] ?? json['username'] ?? '',
    email: json['email'],
    address: json['address'],
    role: json['role'] ?? 'customer',
  );

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'phone': phone, 'email': email, 'address': address, 'role': role};
}

class UiSettings {
  final bool showCategories;
  final bool showHeroSection;
  final bool showSpecialOffers;
  final bool showOrdersPage;
  final bool showTrackOrdersPage;
  final bool showSearchBar;
  final bool showSupportButton;
  final String appName;
  final String supportWhatsapp;
  final String supportPhone;
  final String storeStatus;
  final String openingTime;
  final String closingTime;

  const UiSettings({
    this.showCategories = true,
    this.showHeroSection = true,
    this.showSpecialOffers = true,
    this.showOrdersPage = true,
    this.showTrackOrdersPage = true,
    this.showSearchBar = true,
    this.showSupportButton = true,
    this.appName = 'طمطوم',
    this.supportWhatsapp = '',
    this.supportPhone = '',
    this.storeStatus = 'open',
    this.openingTime = '08:00',
    this.closingTime = '22:00',
  });

  static String _get(List<dynamic> settings, String key, String fallback) {
    try {
      final s = settings.firstWhere((s) => s['key'] == key, orElse: () => null);
      return s?['value']?.toString() ?? fallback;
    } catch (_) { return fallback; }
  }

  static bool _getBool(List<dynamic> settings, String key, bool fallback) {
    return _get(settings, key, fallback ? 'true' : 'false') != 'false';
  }

  factory UiSettings.fromList(List<dynamic> settings) => UiSettings(
    showCategories: _getBool(settings, 'show_categories', true),
    showHeroSection: _getBool(settings, 'show_hero_section', true),
    showSpecialOffers: _getBool(settings, 'show_special_offers', true),
    showOrdersPage: _getBool(settings, 'show_orders_page', true),
    showTrackOrdersPage: _getBool(settings, 'show_track_orders_page', true),
    showSearchBar: _getBool(settings, 'show_search_bar', true),
    showSupportButton: _getBool(settings, 'show_support_button', true),
    appName: _get(settings, 'app_name', 'طمطوم'),
    supportWhatsapp: _get(settings, 'support_whatsapp', ''),
    supportPhone: _get(settings, 'support_phone', ''),
    storeStatus: _get(settings, 'store_status', 'open'),
    openingTime: _get(settings, 'opening_time', '08:00'),
    closingTime: _get(settings, 'closing_time', '22:00'),
  );
}
