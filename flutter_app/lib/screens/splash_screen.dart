// lib/screens/splash_screen.dart
// شاشة البداية - تجلب الإعدادات من السيرفر ثم تنتقل للشاشة الرئيسية

import 'package:flutter/material.dart';
import '../services/config_service.dart';
import '../providers/settings_provider.dart';
import 'package:provider/provider.dart';
import 'main_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;

  late AnimationController _textController;
  late Animation<double> _textOpacity;
  late Animation<Offset> _textSlide;

  AppConfig? _config;
  bool _configLoaded = false;

  @override
  void initState() {
    super.initState();

    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _logoScale = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.elasticOut),
    );

    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
          parent: _logoController,
          curve: const Interval(0, 0.4, curve: Curves.easeIn)),
    );

    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _textOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _textController, curve: Curves.easeIn),
    );

    _textSlide = Tween<Offset>(
            begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(
            CurvedAnimation(parent: _textController, curve: Curves.easeOut));

    _initSplash();
  }

  Future<void> _initSplash() async {
    // تحميل الإعدادات بالتوازي مع تشغيل الرسوم المتحركة
    final configFuture = ConfigService.fetchConfig();

    await _logoController.forward();
    await Future.delayed(const Duration(milliseconds: 200));
    await _textController.forward();

    _config = await configFuture;
    if (mounted) {
      setState(() => _configLoaded = true);
      // تحديث SettingsProvider بالإعدادات الجديدة
      context.read<SettingsProvider>().load();
    }

    final duration = _config?.splashDuration ?? 1500;
    await Future.delayed(Duration(milliseconds: duration.clamp(500, 3000)));

    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) =>
              const MainScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(
                  parent: animation, curve: Curves.easeInOut),
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    }
  }

  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    super.dispose();
  }

  Color _parseColor(String? hex, Color fallback) {
    if (hex == null || hex.isEmpty) return fallback;
    try {
      hex = hex.replaceAll('#', '');
      if (hex.length == 6) hex = 'FF$hex';
      return Color(int.parse(hex, radix: 16));
    } catch (_) {
      return fallback;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = _parseColor(_config?.splashBackgroundColor, Colors.white);
    final primaryColor = _parseColor(_config?.primaryColor, const Color(0xFFE53935));
    final secondaryColor = _parseColor(_config?.secondaryColor, const Color(0xFF2E7D32));
    final logoUrl = _config?.logoUrl ?? '';
    final splashTitle = _config?.splashTitle ?? 'طمطوم';
    final splashSubtitle = _config?.splashSubtitle ?? 'متجر الخضار والفواكه';
    final splashImageUrl = _config?.splashImageUrl ?? '';
    final hasImage = splashImageUrl.isNotEmpty;

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // صورة الخلفية
          if (hasImage)
            Image.network(
              splashImageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: bgColor),
            ),

          // طبقة التدرج اللوني
          if (hasImage)
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.2),
                    Colors.black.withOpacity(0.6),
                  ],
                ),
              ),
            ),

          // المحتوى المركزي
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // الشعار
                AnimatedBuilder(
                  animation: _logoController,
                  builder: (context, child) => Transform.scale(
                    scale: _logoScale.value,
                    child: Opacity(
                      opacity: _logoOpacity.value,
                      child: _buildLogo(logoUrl, primaryColor),
                    ),
                  ),
                ),

                const SizedBox(height: 36),

                // النص
                AnimatedBuilder(
                  animation: _textController,
                  builder: (context, child) => SlideTransition(
                    position: _textSlide,
                    child: Opacity(
                      opacity: _textOpacity.value,
                      child: Column(
                        children: [
                          Text(
                            splashTitle,
                            style: TextStyle(
                              fontSize: 44,
                              fontWeight: FontWeight.bold,
                              color: hasImage ? Colors.white : primaryColor,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            splashSubtitle,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: hasImage
                                  ? Colors.white70
                                  : secondaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // مؤشر تحميل أسفل الشاشة
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Center(
              child: AnimatedOpacity(
                opacity: _configLoaded ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 300),
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: hasImage ? Colors.white : primaryColor,
                    strokeWidth: 2.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo(String logoUrl, Color primaryColor) {
    if (logoUrl.isNotEmpty) {
      return Container(
        width: 130,
        height: 130,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: primaryColor.withOpacity(0.4),
              blurRadius: 25,
              spreadRadius: 8,
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: ClipOval(
          child: Image.network(
            logoUrl,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => Icon(
              Icons.shopping_basket_rounded,
              size: 70,
              color: primaryColor,
            ),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryColor, primaryColor.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: primaryColor.withOpacity(0.4),
            blurRadius: 25,
            spreadRadius: 8,
          ),
        ],
      ),
      child: const Icon(
        Icons.shopping_basket_rounded,
        size: 80,
        color: Colors.white,
      ),
    );
  }
}
