// lib/screens/splash_screen.dart
// شاشة البداية مع جلب الإعدادات من السيرفر

import 'package:flutter/material.dart';
import '../services/config_service.dart';
import 'webview_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _logoController;
  late Animation<double> _logoAnimation;
  late Animation<double> _logoOpacity;

  late AnimationController _textController;
  late Animation<double> _textOpacity;

  AppConfig? _config;
  bool _configLoaded = false;

  @override
  void initState() {
    super.initState();

    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _logoAnimation = Tween<double>(begin: -200, end: 0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.bounceOut),
    );

    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _logoController, curve: const Interval(0, 0.5, curve: Curves.easeIn)),
    );

    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _textOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _textController, curve: Curves.easeIn),
    );

    _initSplash();
  }

  Future<void> _initSplash() async {
    final config = await ConfigService.fetchConfig();
    if (mounted) {
      setState(() {
        _config = config;
        _configLoaded = true;
      });
    }
    await _startAnimation();
  }

  Future<void> _startAnimation() async {
    await _logoController.forward();
    await _textController.forward();

    final duration = _config?.splashDuration ?? 2000;
    await Future.delayed(Duration(milliseconds: duration));

    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => WebViewScreen(config: _config),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 800),
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
    final primaryColor = _parseColor(_config?.primaryColor, Colors.red);
    final secondaryColor = _parseColor(_config?.secondaryColor, Colors.green);
    final logoUrl = _config?.logoUrl ?? '';
    final splashTitle = _config?.splashTitle ?? 'طمطوم';
    final splashSubtitle = _config?.splashSubtitle ?? 'متجر الخضار والفواكه';
    final splashImageUrl = _config?.splashImageUrl ?? '';

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // خلفية الصورة إن وجدت
          if (splashImageUrl.isNotEmpty)
            Image.network(
              splashImageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: bgColor),
            ),

          // طبقة شفافة فوق الصورة
          if (splashImageUrl.isNotEmpty)
            Container(color: Colors.black.withOpacity(0.4)),

          // المحتوى المركزي
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // الشعار
                AnimatedBuilder(
                  animation: _logoController,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(0, _logoAnimation.value),
                      child: Opacity(
                        opacity: _logoOpacity.value,
                        child: _buildLogo(logoUrl, primaryColor),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 32),

                // النص
                AnimatedBuilder(
                  animation: _textController,
                  builder: (context, child) {
                    return Opacity(
                      opacity: _textOpacity.value,
                      child: Column(
                        children: [
                          Text(
                            splashTitle,
                            style: TextStyle(
                              fontSize: 42,
                              fontWeight: FontWeight.bold,
                              color: splashImageUrl.isNotEmpty ? Colors.white : primaryColor,
                              letterSpacing: 2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            splashSubtitle,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w500,
                              color: splashImageUrl.isNotEmpty ? Colors.white70 : secondaryColor,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),

          // مؤشر تحميل صغير أثناء جلب الإعدادات
          if (!_configLoaded)
            Positioned(
              bottom: 60,
              left: 0,
              right: 0,
              child: Center(
                child: CircularProgressIndicator(
                  color: primaryColor,
                  strokeWidth: 2,
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
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: primaryColor.withOpacity(0.3),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
        ),
        padding: const EdgeInsets.all(10),
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: primaryColor,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: primaryColor.withOpacity(0.3),
            blurRadius: 20,
            spreadRadius: 5,
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
