// lib/screens/main_screen.dart
// الشاشة الرئيسية مع شريط التنقل السفلي وزر الواتساب المركزي

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/cart_provider.dart';
import '../providers/settings_provider.dart';
import 'home_screen.dart';
import 'orders_screen.dart';
import 'favorites_screen.dart';
import 'profile_screen.dart';

class MainScreen extends StatefulWidget {
  final int initialIndex;
  const MainScreen({super.key, this.initialIndex = 0});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  late int _currentIndex;

  // الشاشات: 0=الرئيسية, 1=طلباتي, 2=المفضلة, 3=حسابي
  final List<Widget> _screens = const [
    HomeScreen(),
    OrdersScreen(),
    FavoritesScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SettingsProvider>().load();
    });
  }

  Future<void> _openWhatsApp(String phone) async {
    // تنظيف رقم الهاتف
    final cleaned = phone.replaceAll(RegExp(r'[^\d]'), '');
    final number = cleaned.startsWith('0')
        ? '966${cleaned.substring(1)}'
        : cleaned.isEmpty
            ? '966500000000'
            : cleaned;

    final urls = [
      'whatsapp://send?phone=$number',
      'https://wa.me/$number',
    ];

    for (final urlStr in urls) {
      try {
        final uri = Uri.parse(urlStr);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
          return;
        }
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>().settings;
    final cartCount = context.watch<CartProvider>().itemCount;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),

        // زر الواتساب العائم في المنتصف
        floatingActionButton: settings.showSupportButton
            ? _WhatsAppFab(
                phone: settings.supportWhatsapp,
                onTap: () => _openWhatsApp(settings.supportWhatsapp),
              )
            : null,
        floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,

        // شريط التنقل السفلي
        bottomNavigationBar: _buildBottomBar(cartCount, settings.showSupportButton),
      ),
    );
  }

  Widget _buildBottomBar(int cartCount, bool showWhatsApp) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: showWhatsApp
          ? _buildDockedBottomBar(cartCount)
          : _buildSimpleBottomBar(cartCount),
    );
  }

  // شريط سفلي مع مكان للزر العائم (حين يكون زر الواتساب مفعّلاً)
  Widget _buildDockedBottomBar(int cartCount) {
    return BottomAppBar(
      color: Colors.white,
      elevation: 0,
      notchMargin: 8,
      shape: const CircularNotchedRectangle(),
      child: SizedBox(
        height: 60,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            // الرئيسية - يمين
            _NavItem(
              icon: Icons.home_outlined,
              activeIcon: Icons.home_rounded,
              label: 'الرئيسية',
              isActive: _currentIndex == 0,
              onTap: () => setState(() => _currentIndex = 0),
            ),

            // طلباتي
            _NavItem(
              icon: Icons.receipt_long_outlined,
              activeIcon: Icons.receipt_long,
              label: 'طلباتي',
              isActive: _currentIndex == 1,
              badge: cartCount > 0 ? cartCount : null,
              onTap: () => setState(() => _currentIndex = 1),
            ),

            // مساحة للزر العائم في المنتصف
            const SizedBox(width: 60),

            // المفضلة
            _NavItem(
              icon: Icons.favorite_outline,
              activeIcon: Icons.favorite,
              label: 'المفضلة',
              isActive: _currentIndex == 2,
              onTap: () => setState(() => _currentIndex = 2),
            ),

            // حسابي
            _NavItem(
              icon: Icons.person_outline,
              activeIcon: Icons.person,
              label: 'حسابي',
              isActive: _currentIndex == 3,
              onTap: () => setState(() => _currentIndex = 3),
            ),
          ],
        ),
      ),
    );
  }

  // شريط سفلي بسيط (حين يكون زر الواتساب مُخفياً)
  Widget _buildSimpleBottomBar(int cartCount) {
    return BottomNavigationBar(
      currentIndex: _currentIndex,
      onTap: (i) => setState(() => _currentIndex = i),
      type: BottomNavigationBarType.fixed,
      selectedItemColor: const Color(0xFFE53935),
      unselectedItemColor: Colors.grey,
      backgroundColor: Colors.white,
      elevation: 0,
      selectedFontSize: 11,
      unselectedFontSize: 10,
      items: [
        const BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          activeIcon: Icon(Icons.home_rounded),
          label: 'الرئيسية',
        ),
        BottomNavigationBarItem(
          icon: _buildBadgedIcon(Icons.receipt_long_outlined, cartCount),
          activeIcon: _buildBadgedIcon(Icons.receipt_long, cartCount),
          label: 'طلباتي',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.favorite_outline),
          activeIcon: Icon(Icons.favorite),
          label: 'المفضلة',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          activeIcon: Icon(Icons.person),
          label: 'حسابي',
        ),
      ],
    );
  }

  Widget _buildBadgedIcon(IconData icon, int count) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon),
        if (count > 0)
          Positioned(
            right: -6,
            top: -4,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: Color(0xFFE53935),
                shape: BoxShape.circle,
              ),
              child: Text(
                count > 9 ? '9+' : '$count',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// زر الواتساب المركزي
class _WhatsAppFab extends StatelessWidget {
  final String phone;
  final VoidCallback onTap;

  const _WhatsAppFab({required this.phone, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 58,
        height: 58,
        decoration: BoxDecoration(
          color: const Color(0xFF25D366),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF25D366).withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(
          Icons.chat_rounded,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }
}

// عنصر في شريط التنقل
class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final int? badge;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive ? const Color(0xFFE53935) : Colors.grey;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 70,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isActive ? activeIcon : icon,
                  color: color,
                  size: 26,
                ),
                if (badge != null && badge! > 0)
                  Positioned(
                    right: -6,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Color(0xFFE53935),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        badge! > 9 ? '9+' : '$badge',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: color,
                fontWeight:
                    isActive ? FontWeight.w700 : FontWeight.normal,
              ),
            ),
            if (isActive)
              Container(
                margin: const EdgeInsets.only(top: 2),
                width: 18,
                height: 2.5,
                decoration: BoxDecoration(
                  color: const Color(0xFFE53935),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
