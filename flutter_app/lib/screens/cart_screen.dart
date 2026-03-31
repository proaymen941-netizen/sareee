// lib/screens/cart_screen.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/app_models.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'orders_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();
  String _paymentMethod = 'cash';
  double _deliveryFee = 5.0;
  bool _isOrdering = false;

  @override
  void initState() {
    super.initState();
    _prefillUser();
  }

  Future<void> _prefillUser() async {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _nameController.text = user.name;
      _phoneController.text = user.phone;
      if (user.address != null) _addressController.text = user.address!;
    } else {
      final prefs = await SharedPreferences.getInstance();
      _nameController.text = prefs.getString('customer_name') ?? '';
      _phoneController.text = prefs.getString('customer_phone') ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          leading: IconButton(icon: const Icon(Icons.arrow_back_ios, color: Colors.black), onPressed: () => Navigator.pop(context)),
          title: const Text('سلة التسوق', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        ),
        body: cart.isEmpty
            ? _buildEmptyCart()
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  _buildCartItems(cart),
                  const SizedBox(height: 16),
                  _buildOrderForm(),
                  const SizedBox(height: 16),
                  _buildPaymentMethod(),
                  const SizedBox(height: 16),
                  _buildSummary(cart),
                  const SizedBox(height: 100),
                ]),
              ),
        bottomNavigationBar: cart.isEmpty ? null : _buildOrderButton(cart),
      ),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey),
        const SizedBox(height: 16),
        const Text('سلة التسوق فارغة', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey)),
        const SizedBox(height: 8),
        const Text('أضف بعض المنتجات لتبدأ', style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 24),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE53935), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14)),
          onPressed: () => Navigator.pop(context),
          child: const Text('تسوق الآن'),
        ),
      ]),
    );
  }

  Widget _buildCartItems(CartProvider cart) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(children: [
            const Text('المنتجات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const Spacer(),
            TextButton(
              onPressed: () => _showClearDialog(cart),
              child: const Text('مسح الكل', style: TextStyle(color: Color(0xFFE53935))),
            ),
          ]),
        ),
        ...cart.items.map((item) => _buildCartItemRow(item, cart)),
      ]),
    );
  }

  Widget _buildCartItemRow(CartItem item, CartProvider cart) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: item.item.image != null && item.item.image!.isNotEmpty
              ? CachedNetworkImage(imageUrl: item.item.image!, width: 56, height: 56, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(width: 56, height: 56, color: Colors.grey.shade200, child: const Icon(Icons.fastfood)))
              : Container(width: 56, height: 56, color: Colors.grey.shade100, child: const Icon(Icons.fastfood, color: Colors.grey)),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(item.item.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
          Text('${item.item.price.toStringAsFixed(2)} ر.س', style: const TextStyle(color: Color(0xFFE53935), fontSize: 12)),
        ])),
        Row(children: [
          GestureDetector(
            onTap: () => cart.decreaseItem(item.item.id),
            child: Container(padding: const EdgeInsets.all(4), decoration: BoxDecoration(color: Colors.grey.shade200, shape: BoxShape.circle), child: const Icon(Icons.remove, size: 16)),
          ),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 10), child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
          GestureDetector(
            onTap: () => cart.addItem(item.item, item.restaurantId, item.restaurantName),
            child: Container(padding: const EdgeInsets.all(4), decoration: const BoxDecoration(color: Color(0xFFE53935), shape: BoxShape.circle), child: const Icon(Icons.add, color: Colors.white, size: 16)),
          ),
        ]),
        const SizedBox(width: 8),
        Text('${item.total.toStringAsFixed(2)} ر.س', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      ]),
    );
  }

  Widget _buildOrderForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('بيانات التوصيل', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        _buildField('الاسم الكامل', _nameController, Icons.person_outline),
        const SizedBox(height: 10),
        _buildField('رقم الهاتف', _phoneController, Icons.phone_outlined, keyboardType: TextInputType.phone),
        const SizedBox(height: 10),
        _buildField('عنوان التوصيل', _addressController, Icons.location_on_outlined, maxLines: 2),
        const SizedBox(height: 10),
        _buildField('ملاحظات (اختياري)', _notesController, Icons.note_outlined, maxLines: 2),
      ]),
    );
  }

  Widget _buildField(String label, TextEditingController ctrl, IconData icon, {TextInputType? keyboardType, int maxLines = 1}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboardType,
      maxLines: maxLines,
      textDirection: TextDirection.rtl,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE53935))),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
    );
  }

  Widget _buildPaymentMethod() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('طريقة الدفع', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        RadioListTile<String>(
          value: 'cash',
          groupValue: _paymentMethod,
          onChanged: (v) => setState(() => _paymentMethod = v!),
          title: const Text('نقداً عند الاستلام'),
          secondary: const Icon(Icons.money, color: Color(0xFF4CAF50)),
          activeColor: const Color(0xFFE53935),
          contentPadding: EdgeInsets.zero,
        ),
        RadioListTile<String>(
          value: 'card',
          groupValue: _paymentMethod,
          onChanged: (v) => setState(() => _paymentMethod = v!),
          title: const Text('بطاقة ائتمانية'),
          secondary: const Icon(Icons.credit_card, color: Color(0xFF2196F3)),
          activeColor: const Color(0xFFE53935),
          contentPadding: EdgeInsets.zero,
        ),
      ]),
    );
  }

  Widget _buildSummary(CartProvider cart) {
    final total = cart.subtotal + _deliveryFee;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(children: [
        _summaryRow('المجموع الفرعي', '${cart.subtotal.toStringAsFixed(2)} ر.س'),
        const SizedBox(height: 8),
        _summaryRow('رسوم التوصيل', '${_deliveryFee.toStringAsFixed(2)} ر.س'),
        const Divider(height: 20),
        _summaryRow('الإجمالي', '${total.toStringAsFixed(2)} ر.س', isBold: true),
      ]),
    );
  }

  Widget _summaryRow(String label, String value, {bool isBold = false}) {
    return Row(children: [
      Text(label, style: TextStyle(fontSize: 14, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: isBold ? Colors.black : Colors.grey.shade700)),
      const Spacer(),
      Text(value, style: TextStyle(fontSize: 14, fontWeight: isBold ? FontWeight.bold : FontWeight.w600, color: isBold ? const Color(0xFFE53935) : Colors.black)),
    ]);
  }

  Widget _buildOrderButton(CartProvider cart) {
    final total = cart.subtotal + _deliveryFee;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 30),
      decoration: const BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, -2))]),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE53935),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          minimumSize: const Size(double.infinity, 50),
        ),
        onPressed: _isOrdering ? null : () => _placeOrder(cart),
        child: _isOrdering
            ? const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                SizedBox(width: 10),
                Text('جاري الإرسال...'),
              ])
            : Text('تأكيد الطلب • ${total.toStringAsFixed(2)} ر.س', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Future<void> _placeOrder(CartProvider cart) async {
    if (_nameController.text.trim().isEmpty || _phoneController.text.trim().isEmpty || _addressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('يرجى تعبئة جميع الحقول المطلوبة'), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isOrdering = true);

    final orderData = {
      'customerName': _nameController.text.trim(),
      'customerPhone': _phoneController.text.trim(),
      'deliveryAddress': _addressController.text.trim(),
      'notes': _notesController.text.trim(),
      'paymentMethod': _paymentMethod,
      'restaurantId': cart.restaurantId,
      'restaurantName': cart.restaurantName,
      'items': cart.toOrderItems(),
      'subtotal': cart.subtotal.toString(),
      'deliveryFee': _deliveryFee.toString(),
      'total': (cart.subtotal + _deliveryFee).toString(),
      'totalAmount': (cart.subtotal + _deliveryFee).toString(),
    };

    final result = await ApiService.createOrder(orderData);

    if (mounted) {
      setState(() => _isOrdering = false);
      if (result['success'] == true) {
        cart.clear();
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('customer_phone', _phoneController.text.trim());
        await prefs.setString('customer_name', _nameController.text.trim());
        if (mounted) {
          Navigator.of(context).popUntil((route) => route.isFirst);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('✅ تم إرسال طلبك بنجاح!'),
            backgroundColor: Color(0xFF4CAF50),
            duration: Duration(seconds: 3),
          ));
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(result['message']?.toString() ?? 'حدث خطأ في الطلب'),
          backgroundColor: Colors.red,
        ));
      }
    }
  }

  void _showClearDialog(CartProvider cart) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('مسح السلة'),
        content: const Text('هل تريد إزالة جميع المنتجات من السلة؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () { cart.clear(); Navigator.pop(context); Navigator.pop(context); },
            child: const Text('مسح', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
