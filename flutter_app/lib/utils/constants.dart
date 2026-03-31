// lib/utils/constants.dart
// الثوابت والإعدادات العامة
// تحديث: يجب تغيير serverBaseUrl عند نشر التطبيق

class AppConstants {
  static const String appName = 'طمطوم';

  // ================================================================
  // عنوان السيرفر - يجب تحديثه عند تغيير رابط الاستضافة
  // Development (Replit): https://df3719d4-e40c-4622-9aa0-91f6278bfa09-00-2502dksbtnde2.pike.replit.dev
  // Production (Render):  https://tamtomsture.onrender.com
  // ================================================================
  static const String serverBaseUrl =
      'https://df3719d4-e40c-4622-9aa0-91f6278bfa09-00-2502dksbtnde2.pike.replit.dev';

  // عنوان الموقع المعروض (يُستخدم كقيمة افتراضية إذا لم يأتِ من السيرفر)
  static const String websiteUrl = serverBaseUrl;

  // عنوان الـ API الخاص بإعدادات Flutter
  static const String flutterConfigApi = '$serverBaseUrl/api/flutter/app-config';

  // ================================================================
  // التحقق من الروابط المسموح بها داخل WebView
  // الروابط الخارجية مثل WhatsApp والهاتف والرسائل ستُفتح خارجياً
  // ================================================================
  static bool isAllowedUrl(String url) {
    if (url.startsWith('tel:') ||
        url.startsWith('sms:') ||
        url.startsWith('smsto:') ||
        url.startsWith('mailto:') ||
        url.startsWith('whatsapp://') ||
        url.startsWith('tg://') ||
        url.startsWith('telegram://') ||
        url.startsWith('market://') ||
        url.startsWith('intent://') ||
        url.startsWith('geo:')) {
      return false;
    }

    // نطاقات Replit
    if (url.contains('.pike.replit.dev') ||
        url.contains('.replit.dev') ||
        url.contains('.replit.app') ||
        url.contains('.repl.co')) {
      return true;
    }

    // نطاق الخادم الإنتاجي
    if (url.contains('tamtomsture.onrender.com')) {
      return true;
    }

    // localhost للتطوير المحلي
    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      return true;
    }

    return false;
  }
}
