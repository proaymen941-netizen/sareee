// lib/utils/constants.dart
// الثوابت والإعدادات العامة للتطبيق

class AppConstants {
  static const String appName = 'طمطوم';
  static const String appVersion = '2.0.0';

  // ================================================================
  // عنوان السيرفر الحالي (Replit)
  // يُحدَّث تلقائياً من الإعدادات السحابية
  // ================================================================
  static const String serverBaseUrl =
      'https://694c4e6c-a709-442a-9940-744c7b7f63ad-00-2c85ta1srmq7m.sisko.replit.dev';

  // عنوان الواجهة الأمامية
  static const String websiteUrl = serverBaseUrl;

  // مسارات API
  static const String flutterConfigApi = '$serverBaseUrl/api/flutter/app-config';
  static const String settingsVersionApi = '$serverBaseUrl/api/flutter/settings-version';
  static const String fullConfigApi = '$serverBaseUrl/api/flutter/full-config';

  // ================================================================
  // مفتاح API الخاص بتطبيق Flutter
  // ================================================================
  static const String flutterApiKey = 'tamtom-flutter-app-2024';

  // مدة التحقق من التحديثات (بالثواني)
  static const int settingsCheckIntervalSeconds = 30;

  // ================================================================
  // ألوان التطبيق الافتراضية
  // ================================================================
  static const int primaryColorHex = 0xFFE53935;
  static const int secondaryColorHex = 0xFF2E7D32;
  static const int accentColorHex = 0xFFFF9800;

  // ================================================================
  // التحقق من الروابط المسموح بها
  // ================================================================
  static bool isExternalUrl(String url) {
    return url.startsWith('tel:') ||
        url.startsWith('sms:') ||
        url.startsWith('smsto:') ||
        url.startsWith('mailto:') ||
        url.startsWith('whatsapp://') ||
        url.startsWith('tg://') ||
        url.startsWith('telegram://') ||
        url.startsWith('market://') ||
        url.startsWith('intent://') ||
        url.startsWith('geo:');
  }

  static bool isAllowedUrl(String url) {
    if (isExternalUrl(url)) return false;

    if (url.contains('.pike.replit.dev') ||
        url.contains('.sisko.replit.dev') ||
        url.contains('.replit.dev') ||
        url.contains('.replit.app') ||
        url.contains('.repl.co')) {
      return true;
    }

    if (url.contains('tamtomsture.onrender.com') ||
        url.contains('tamtom')) {
      return true;
    }

    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      return true;
    }

    return false;
  }
}
