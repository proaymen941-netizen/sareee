// lib/screens/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import 'login_screen.dart';
import 'orders_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;
    final settings = context.watch<SettingsProvider>().settings;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          title: const Text('حسابي', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        ),
        body: ListView(
          children: [
            _buildProfileHeader(context, user),
            const SizedBox(height: 16),
            if (user != null) ...[
              _buildMenuSection(context, [
                _MenuItem(Icons.receipt_long_outlined, 'طلباتي', 'عرض تاريخ الطلبات', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen()))),
                _MenuItem(Icons.location_on_outlined, 'عناوين التوصيل', 'إدارة عناوينك المحفوظة', () {}),
              ]),
              const SizedBox(height: 12),
            ],
            _buildMenuSection(context, [
              _MenuItem(Icons.info_outline, 'عن التطبيق', settings.appName, () => _showAbout(context, settings.appName)),
              if (settings.showSupportButton && settings.supportWhatsapp.isNotEmpty)
                _MenuItem(Icons.support_agent_outlined, 'تواصل معنا', 'واتساب: ${settings.supportWhatsapp}', () {}),
              _MenuItem(Icons.privacy_tip_outlined, 'سياسة الخصوصية', '', () {}),
            ]),
            if (user != null) ...[
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.logout),
                  label: const Text('تسجيل الخروج', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  onPressed: () => _logout(context),
                ),
              ),
            ],
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, user) {
    if (user == null) {
      return Container(
        color: Colors.white,
        padding: const EdgeInsets.all(24),
        child: Column(children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(color: Colors.grey.shade200, shape: BoxShape.circle),
            child: const Icon(Icons.person, size: 40, color: Colors.grey),
          ),
          const SizedBox(height: 16),
          const Text('مرحباً بك!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('سجّل دخولك لإدارة حسابك', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE53935), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                child: const Text('تسجيل الدخول', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFE53935), side: const BorderSide(color: Color(0xFFE53935)), padding: const EdgeInsets.symmetric(vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen(isRegister: true))),
                child: const Text('إنشاء حساب', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ]),
        ]),
      );
    }

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(20),
      child: Row(children: [
        Container(
          width: 60, height: 60,
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFFE53935), Color(0xFF4CAF50)]),
            shape: BoxShape.circle,
          ),
          child: Center(child: Text(user.name.isNotEmpty ? user.name[0] : 'م', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 24))),
        ),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(user.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          const SizedBox(height: 2),
          Text(user.phone, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          if (user.email != null) Text(user.email!, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: const Color(0xFF4CAF50).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: const Text('عميل', style: TextStyle(color: Color(0xFF4CAF50), fontSize: 12, fontWeight: FontWeight.bold)),
        ),
      ]),
    );
  }

  Widget _buildMenuSection(BuildContext context, List<_MenuItem> items) {
    return Container(
      color: Colors.white,
      child: Column(
        children: items.map((item) {
          final idx = items.indexOf(item);
          return Column(
            children: [
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: const Color(0xFFE53935).withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                  child: Icon(item.icon, color: const Color(0xFFE53935), size: 20),
                ),
                title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                subtitle: item.subtitle.isNotEmpty ? Text(item.subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)) : null,
                trailing: const Icon(Icons.chevron_left, color: Colors.grey, size: 18),
                onTap: item.onTap,
              ),
              if (idx < items.length - 1) const Divider(height: 1, indent: 60),
            ],
          );
        }).toList(),
      ),
    );
  }

  void _logout(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل تريد تسجيل الخروج من حسابك؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () {
              context.read<AuthProvider>().logout();
              Navigator.pop(context);
            },
            child: const Text('خروج'),
          ),
        ],
      ),
    );
  }

  void _showAbout(BuildContext context, String appName) {
    showAboutDialog(
      context: context,
      applicationName: appName,
      applicationVersion: '2.0.0',
      children: [const Text('متجر الخضار والفواكه الطازجة.')],
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  _MenuItem(this.icon, this.title, this.subtitle, this.onTap);
}
