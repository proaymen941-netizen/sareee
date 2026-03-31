import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/config_service.dart';
import 'privacy_screen.dart';

class WebScreen extends StatefulWidget {
  final AppConfig config;
  const WebScreen({Key? key, required this.config}) : super(key: key);

  @override
  State<WebScreen> createState() => _WebScreenState();
}

class _WebScreenState extends State<WebScreen> {
  late WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;
  bool _isConnected = true;
  double _loadingProgress = 0;
  late StreamSubscription<List<ConnectivityResult>> _connectivitySub;

  Color get primaryColor {
    try {
      return Color(ConfigService.hexToColor(widget.config.primaryColor));
    } catch (_) {
      return const Color(0xFF4CAF50);
    }
  }

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
    _initWebView();
  }

  Future<void> _checkConnectivity() async {
    final result = await Connectivity().checkConnectivity();
    setState(() {
      _isConnected = result.isNotEmpty && !result.contains(ConnectivityResult.none);
    });
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final connected = results.isNotEmpty && !results.contains(ConnectivityResult.none);
      if (connected && !_isConnected) {
        setState(() { _isConnected = true; _hasError = false; });
        _controller.reload();
      }
      setState(() { _isConnected = connected; });
    });
  }

  void _initWebView() {
    final webAppUrl = widget.config.webAppUrl.isNotEmpty
        ? widget.config.webAppUrl
        : 'https://tamtomsture.onrender.com';

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(NavigationDelegate(
        onProgress: (progress) {
          setState(() { _loadingProgress = progress / 100; });
        },
        onPageStarted: (url) {
          setState(() { _isLoading = true; _hasError = false; });
        },
        onPageFinished: (url) {
          setState(() { _isLoading = false; });
          _injectNativeInterface();
        },
        onWebResourceError: (error) {
          setState(() { _hasError = true; _isLoading = false; });
        },
        onNavigationRequest: (request) {
          if (request.url.contains('privacy') ||
              request.url.endsWith('/privacy-policy')) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PrivacyScreen(
                  content: widget.config.privacyPolicyText,
                ),
              ),
            );
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: (JavaScriptMessage message) {
          _handleWebMessage(message.message);
        },
      )
      ..loadRequest(Uri.parse(webAppUrl));
  }

  Future<void> _injectNativeInterface() async {
    await _controller.runJavaScript('''
      window.isFlutterApp = true;
      window.flutterAppVersion = "${widget.config.appVersion}";
      console.log('[Tamtom Flutter] Native bridge ready');
    ''');
  }

  void _handleWebMessage(String message) {
    print('[Flutter Bridge] Received: $message');
  }

  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      _controller.goBack();
      return false;
    }
    return true;
  }

  @override
  void dispose() {
    _connectivitySub.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              if (!_isConnected)
                _buildNoInternetWidget()
              else if (_hasError)
                _buildErrorWidget()
              else
                Column(
                  children: [
                    if (_isLoading)
                      LinearProgressIndicator(
                        value: _loadingProgress > 0 ? _loadingProgress : null,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
                        minHeight: 3,
                      ),
                    Expanded(
                      child: WebViewWidget(controller: _controller),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNoInternetWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off_rounded, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 24),
            Text(
              'لا يوجد اتصال بالإنترنت',
              textDirection: TextDirection.rtl,
              style: GoogleFonts.cairo(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF333333),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'يرجى التحقق من اتصالك بالإنترنت وإعادة المحاولة',
              textDirection: TextDirection.rtl,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                setState(() { _hasError = false; });
                _controller.reload();
              },
              icon: const Icon(Icons.refresh_rounded),
              label: Text('إعادة المحاولة',
                  style: GoogleFonts.cairo()),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 80, color: Colors.red[300]),
            const SizedBox(height: 24),
            Text(
              'تعذر تحميل الصفحة',
              textDirection: TextDirection.rtl,
              style: GoogleFonts.cairo(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF333333),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'حدث خطأ أثناء تحميل المتجر. يرجى المحاولة مجدداً.',
              textDirection: TextDirection.rtl,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                setState(() { _hasError = false; });
                _controller.reload();
              },
              icon: const Icon(Icons.refresh_rounded),
              label: Text('إعادة المحاولة',
                  style: GoogleFonts.cairo()),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
