// lib/screens/orders_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import 'restaurant_screen.dart';
import 'login_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Order> _orders = [];
  bool _isLoading = false;
  String? _phone;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadPhone();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadPhone() async {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _phone = user.phone;
    } else {
      final prefs = await SharedPreferences.getInstance();
      _phone = prefs.getString('customer_phone');
    }
    if (_phone != null && _phone!.isNotEmpty) _fetchOrders();
    else if (mounted) setState(() {});
  }

  Future<void> _fetchOrders() async {
    if (_phone == null || _phone!.isEmpty) return;
    setState(() => _isLoading = true);
    final orders = await ApiService.getOrdersByPhone(_phone!);
    if (mounted) setState(() { _orders = orders; _isLoading = false; });
  }

  List<Order> _filterOrders(String tab) {
    switch (tab) {
      case 'active': return _orders.where((o) => o.isActive).toList();
      case 'completed': return _orders.where((o) => o.isCompleted).toList();
      case 'cancelled': return _orders.where((o) => o.isCancelled).toList();
      default: return _orders;
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
          elevation: 0,
          title: const Text('طلباتي', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          bottom: TabBar(
            controller: _tabController,
            labelColor: const Color(0xFFE53935),
            unselectedLabelColor: Colors.grey,
            indicatorColor: const Color(0xFFE53935),
            isScrollable: true,
            tabs: const [
              Tab(text: 'جميع الطلبات'),
              Tab(text: 'النشطة'),
              Tab(text: 'المكتملة'),
              Tab(text: 'الملغية'),
            ],
          ),
        ),
        body: _phone == null || _phone!.isEmpty
            ? _buildNoPhone()
            : _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFFE53935)))
                : TabBarView(
                    controller: _tabController,
                    children: ['all', 'active', 'completed', 'cancelled']
                        .map((t) => _buildOrderList(_filterOrders(t)))
                        .toList(),
                  ),
      ),
    );
  }

  Widget _buildNoPhone() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.receipt_long_outlined, size: 80, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('سجّل دخولك لعرض طلباتك', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('تتبع ومراجعة طلباتك بسهولة', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 24),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE53935), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14)),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())).then((_) => _loadPhone()),
            child: const Text('تسجيل الدخول', style: TextStyle(fontSize: 15)),
          ),
        ]),
      ),
    );
  }

  Widget _buildOrderList(List<Order> orders) {
    if (orders.isEmpty) {
      return RefreshIndicator(
        onRefresh: _fetchOrders,
        color: const Color(0xFFE53935),
        child: ListView(children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.6,
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.inbox_outlined, size: 70, color: Colors.grey),
              const SizedBox(height: 16),
              const Text('لا توجد طلبات', style: TextStyle(fontSize: 18, color: Colors.grey)),
              const SizedBox(height: 8),
              const Text('لم تقم بأي طلبات بعد', style: TextStyle(color: Colors.grey, fontSize: 14)),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE53935), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
                onPressed: () {},
                child: const Text('ابدأ الطلب الآن'),
              ),
            ]),
          ),
        ]),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchOrders,
      color: const Color(0xFFE53935),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (ctx, i) => _buildOrderCard(orders[i]),
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(color: _statusColor(order.status).withOpacity(0.1), borderRadius: const BorderRadius.vertical(top: Radius.circular(16))),
          child: Row(children: [
            Icon(_statusIcon(order.status), color: _statusColor(order.status), size: 18),
            const SizedBox(width: 6),
            Text(order.statusLabel, style: TextStyle(color: _statusColor(order.status), fontWeight: FontWeight.bold, fontSize: 13)),
            const Spacer(),
            Text('#${order.orderNumber}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (order.restaurantName != null)
              Row(children: [
                const Icon(Icons.store, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(order.restaurantName!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              ]),
            const SizedBox(height: 8),
            ...order.items.take(3).map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(children: [
                const Icon(Icons.circle, size: 6, color: Colors.grey),
                const SizedBox(width: 6),
                Text('${item.quantity}x ${item.name}', style: const TextStyle(fontSize: 13)),
                const Spacer(),
                Text('${(item.price * item.quantity).toStringAsFixed(2)} ر.س', style: const TextStyle(fontSize: 13)),
              ]),
            )),
            if (order.items.length > 3) Text('+ ${order.items.length - 3} منتجات أخرى', style: const TextStyle(color: Colors.grey, fontSize: 12)),
            const Divider(height: 20),
            Row(children: [
              const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
              const SizedBox(width: 4),
              Expanded(child: Text(order.deliveryAddress, style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Text('الإجمالي:', style: const TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(width: 4),
              Text('${order.total.toStringAsFixed(2)} ر.س', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFFE53935))),
              const Spacer(),
              if (order.driverPhone != null && order.isActive)
                IconButton(
                  icon: const Icon(Icons.phone, color: Color(0xFF4CAF50), size: 20),
                  onPressed: () {},
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
            ]),
          ]),
        ),
      ]),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'preparing': return Colors.purple;
      case 'on_way': return const Color(0xFF4CAF50);
      case 'delivered': return const Color(0xFF4CAF50);
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'pending': return Icons.access_time;
      case 'confirmed': return Icons.check_circle_outline;
      case 'preparing': return Icons.restaurant;
      case 'on_way': return Icons.delivery_dining;
      case 'delivered': return Icons.check_circle;
      case 'cancelled': return Icons.cancel_outlined;
      default: return Icons.info_outline;
    }
  }
}
