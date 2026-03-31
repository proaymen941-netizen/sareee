// lib/screens/webview_screen.dart
// الشاشة الرئيسية مع دعم كامل للروابط الخارجية والصلاحيات

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../utils/constants.dart';
import '../services/config_service.dart';

class WebViewScreen extends StatefulWidget {
  final AppConfig? config;
  const WebViewScreen({super.key, this.config});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;

  bool _isLoading = true;
  bool _hasError = false;
  bool _isConnected = true;
  bool _isFirstLoad = true;
  double _progress = 0.0;

  String get _websiteUrl {
    final configUrl = widget.config?.webAppUrl ?? '';
    if (configUrl.isNotEmpty) return configUrl;
    return AppConstants.websiteUrl;
  }

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
    _initWebView();
    _monitorConnectivity();
  }

  // ==========================================
  // 📡 فحص الاتصال بالإنترنت
  // ==========================================
  Future<void> _checkConnectivity() async {
    final List<ConnectivityResult> result = await Connectivity().checkConnectivity();
    if (!mounted) return;
    setState(() {
      _isConnected = !result.contains(ConnectivityResult.none);
    });
  }

  // ==========================================
  // 👂 مراقبة تغيير حالة الإنترنت
  // ==========================================
  void _monitorConnectivity() {
    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> result) {
      if (!mounted) return;
      final wasConnected = _isConnected;
      setState(() {
        _isConnected = !result.contains(ConnectivityResult.none);
      });
      if (_isConnected && !wasConnected) {
        _reloadWebView();
      }
    });
  }

  // ==========================================
  // 🔧 تهيئة WebView مع إعدادات كاملة
  // ==========================================
  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..enableZoom(false)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 12; Mobile) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 TamtomApp/1.0'
      )
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: (JavaScriptMessage message) {
          _handleJsBridgeMessage(message.message);
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (!mounted) return;
            setState(() => _progress = progress / 100);
          },
          onPageStarted: (String url) {
            if (!mounted) return;
            setState(() {
              _isLoading = true;
              _hasError = false;
            });
          },
          onPageFinished: (String url) {
            if (!mounted) return;
            setState(() {
              _isLoading = false;
              _isFirstLoad = false;
              _progress = 1.0;
            });
            // إخبار الموقع أنه يعمل داخل Flutter
            _controller.runJavaScript('''
              window.isFlutterApp = true;
              window.flutterAppVersion = "1.0.0";
              if (window.sessionStorage) {
                window.sessionStorage.setItem('flutter_app', 'true');
              }
            ''');
          },
          onWebResourceError: (WebResourceError error) {
            if (!mounted) return;
            // تجاهل أخطاء صغيرة غير حرجة
            if (error.errorCode == -1 && error.isForMainFrame == false) return;
            setState(() {
              _hasError = error.isForMainFrame == true;
              _isLoading = false;
              _isFirstLoad = false;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            return _handleNavigationRequest(request);
          },
        ),
      )
      ..loadRequest(Uri.parse(_websiteUrl));
  }

  // ==========================================
  // 🔗 معالجة طلبات التنقل والروابط الخارجية
  // ==========================================
  NavigationDecision _handleNavigationRequest(NavigationRequest request) {
    final url = request.url;

    // روابط الهاتف
    if (url.startsWith('tel:')) {
      _launchUrl(url);
      return NavigationDecision.prevent;
    }

    // روابط الرسائل القصيرة SMS
    if (url.startsWith('sms:') || url.startsWith('smsto:')) {
      _launchUrl(url);
      return NavigationDecision.prevent;
    }

    // روابط البريد الإلكتروني
    if (url.startsWith('mailto:')) {
      _launchUrl(url);
      return NavigationDecision.prevent;
    }

    // روابط واتساب
    if (url.contains('whatsapp.com') || url.startsWith('whatsapp://') || url.startsWith('https://wa.me/') || url.startsWith('https://api.whatsapp.com/')) {
      _launchUrl(url);
      return NavigationDecision.prevent;
    }

    // روابط تيليجرام
    if (url.contains('t.me/') || url.startsWith('tg://') || url.startsWith('telegram://')) {
      _launchUrl(url);
      return NavigationDecision.prevent;
    }

    // روابط المتجر
    if (url.startsWith('market://') || url.startsWith('intent://')) {
      _launchUrl(url);
      return NavigationDecision.prevent;
    }

    // روابط الخرائط
    if (url.startsWith('geo:') || (url.contains('maps.google.com') && !AppConstants.isAllowedUrl(url))) {
      _launchUrl(url);
      return NavigationDecision.prevent;
    }

    // روابط خارجية غير مسموحة
    if (!AppConstants.isAllowedUrl(url)) {
      _launchInExternalBrowser(url);
      return NavigationDecision.prevent;
    }

    return NavigationDecision.navigate;
  }

  // ==========================================
  // 📨 معالجة رسائل جافاسكريبت Bridge
  // ==========================================
  void _handleJsBridgeMessage(String message) {
    try {
      if (message.startsWith('tel:') || message.startsWith('phone:')) {
        final number = message.replaceFirst(RegExp(r'^(tel:|phone:)'), 'tel:');
        _launchUrl(number);
      } else if (message.startsWith('whatsapp:')) {
        _launchUrl(message.replaceFirst('whatsapp:', 'https://wa.me/'));
      }
    } catch (_) {}
  }

  // ==========================================
  // 🌐 فتح رابط
  // ==========================================
  Future<void> _launchUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  Future<void> _launchInExternalBrowser(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  // ==========================================
  // 🔄 إعادة تحميل الصفحة
  // ==========================================
  void _reloadWebView() {
    if (!_isConnected) return;
    _controller.reload();
    setState(() {
      _hasError = false;
      _isLoading = true;
    });
  }

  // ==========================================
  // ⬅️ العودة للصفحة السابقة أو عرض تأكيد الخروج
  // ==========================================
  void _goBack() async {
    if (await _controller.canGoBack()) {
      _controller.goBack();
    } else {
      _showExitConfirmation();
    }
  }

  // ==========================================
  // ❓ تأكيد الخروج من التطبيق
  // ==========================================
  void _showExitConfirmation() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.exit_to_app, color: Colors.red),
            SizedBox(width: 10),
            Text('إغلاق التطبيق', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'هل أنت متأكد من أنك تريد الخروج من التطبيق؟',
          style: TextStyle(fontSize: 15),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء', style: TextStyle(color: Colors.grey, fontSize: 15)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              exit(0);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('خروج', style: TextStyle(color: Colors.white, fontSize: 15)),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // 📵 رسالة عدم الاتصال بالإنترنت
  // ==========================================
  Widget _buildNoInternetWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 90, color: Colors.grey.shade400),
            const SizedBox(height: 20),
            const Text(
              'لا يوجد اتصال بالإنترنت',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            const Text(
              'يجب توفر اتصال بالإنترنت لاستخدام تطبيق طمطوم. يرجى التحقق من إعدادات الشبكة والمحاولة مجدداً.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 30),
            ElevatedButton.icon(
              onPressed: () async {
                await _checkConnectivity();
                if (_isConnected) _reloadWebView();
              },
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('إعادة المحاولة', style: TextStyle(fontSize: 15)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // ❌ رسالة خطأ في التحميل
  // ==========================================
  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 90, color: Colors.red),
            const SizedBox(height: 20),
            const Text(
              'حدث خطأ في التحميل',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مجدداً.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 30),
            ElevatedButton.icon(
              onPressed: _reloadWebView,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('إعادة المحاولة', style: TextStyle(fontSize: 15)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (!_isConnected) {
      return _buildNoInternetWidget();
    }
    if (_hasError) {
      return _buildErrorWidget();
    }

    return Stack(
      children: [
        WebViewWidget(controller: _controller),

        // شاشة التحميل الأولى
        if (_isFirstLoad && _isLoading)
          Container(
            color: Colors.white,
            width: double.infinity,
            height: double.infinity,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(color: Colors.red),
                  const SizedBox(height: 20),
                  Text(
                    'جاري تحميل ${widget.config?.appName ?? 'طمطوم'}...',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.red,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'يرجى الانتظار للمرة الأولى',
                    style: TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),

        // شريط تقدم للتحميل اللاحق
        if (!_isFirstLoad && _isLoading && _progress < 0.99)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: LinearProgressIndicator(
              value: _progress,
              backgroundColor: Colors.grey.shade200,
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.red),
              minHeight: 3,
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, Object? result) async {
        if (didPop) return;
        _goBack();
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(child: _buildBody()),
      ),
    );
  }
}
