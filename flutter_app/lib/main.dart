// lib/main.dart
// التطبيق الرئيسي - بدون شريط DEBUG

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';
import 'dart:io';
import 'screens/splash_screen.dart';

void main() {
  // 🔥 الخطوة 1: تأكد من تهيئة Flutter
  WidgetsFlutterBinding.ensureInitialized();
  
  // 🔥 الخطوة 2: تهيئة WebView حسب المنصة
  if (Platform.isAndroid) {
    // تهيئة لمنصة Android
    WebViewPlatform.instance = AndroidWebViewPlatform();
  } else if (Platform.isIOS) {
    // تهيئة لمنصة iOS
    WebViewPlatform.instance = WebKitWebViewPlatform();
  }
  
  // 🔥 الخطوة 3: تشغيل التطبيق
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'تطبيق طمطوم',
      
      // إخفاء شريط DEBUG (Banner)
      debugShowCheckedModeBanner: false,
      
      // إعدادات السمة (Theme) - مبسطة بدون شريط علوي
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.red,
          primary: Colors.red,
          secondary: Colors.green,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        
        // إعدادات شريط التطبيق (لن يظهر لأننا أزلناه من WebViewScreen)
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.red,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
        
        // تخصيص الأزرار
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        
        // تخصيص زر الفلوتينج أكشن
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: Colors.red,
          foregroundColor: Colors.white,
        ),
      ),
      
      // تعيين الشاشة الرئيسية إلى SplashScreen
      home: const SplashScreen(),
    );
  }
}