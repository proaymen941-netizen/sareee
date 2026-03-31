import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class AppConfig {
  final bool splashEnabled;
  final String splashImageUrl;
  final String splashImageUrl2;
  final String splashTitle;
  final String splashSubtitle;
  final String splashBackgroundColor;
  final int splashDuration;
  final String appName;
  final String appVersion;
  final String primaryColor;
  final String secondaryColor;
  final String accentColor;
  final String logoUrl;
  final String webAppUrl;
  final String storeStatus;
  final String privacyPolicyText;

  AppConfig({
    this.splashEnabled = true,
    this.splashImageUrl = '',
    this.splashImageUrl2 = '',
    this.splashTitle = 'طمطوم',
    this.splashSubtitle = 'متجر الخضار والفواكه',
    this.splashBackgroundColor = '#FFFFFF',
    this.splashDuration = 2000,
    this.appName = 'طمطوم',
    this.appVersion = '1.0.0',
    this.primaryColor = '#E53935',
    this.secondaryColor = '#43A047',
    this.accentColor = '#FF9800',
    this.logoUrl = '',
    this.webAppUrl = '',
    this.storeStatus = 'open',
    this.privacyPolicyText = '',
  });

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    final c = json['config'] ?? json;
    return AppConfig(
      splashEnabled: c['splashEnabled'] ?? true,
      splashImageUrl: c['splashImageUrl'] ?? '',
      splashImageUrl2: c['splashImageUrl2'] ?? '',
      splashTitle: c['splashTitle'] ?? 'طمطوم',
      splashSubtitle: c['splashSubtitle'] ?? 'متجر الخضار والفواكه',
      splashBackgroundColor: c['splashBackgroundColor'] ?? '#FFFFFF',
      splashDuration: (c['splashDuration'] as num?)?.toInt() ?? 2000,
      appName: c['appName'] ?? 'طمطوم',
      appVersion: c['appVersion'] ?? '1.0.0',
      primaryColor: c['primaryColor'] ?? '#E53935',
      secondaryColor: c['secondaryColor'] ?? '#43A047',
      accentColor: c['accentColor'] ?? '#FF9800',
      logoUrl: c['logoUrl'] ?? '',
      webAppUrl: c['webAppUrl'] ?? '',
      storeStatus: c['storeStatus'] ?? 'open',
      privacyPolicyText: c['privacyPolicyText'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'splashEnabled': splashEnabled,
    'splashImageUrl': splashImageUrl,
    'splashImageUrl2': splashImageUrl2,
    'splashTitle': splashTitle,
    'splashSubtitle': splashSubtitle,
    'splashBackgroundColor': splashBackgroundColor,
    'splashDuration': splashDuration,
    'appName': appName,
    'appVersion': appVersion,
    'primaryColor': primaryColor,
    'secondaryColor': secondaryColor,
    'accentColor': accentColor,
    'logoUrl': logoUrl,
    'webAppUrl': webAppUrl,
    'storeStatus': storeStatus,
    'privacyPolicyText': privacyPolicyText,
  };
}

class ConfigService {
  static const String _cacheKey = 'tamtom_app_config_v1';
  static AppConfig? _cachedConfig;

  static AppConfig get defaultConfig => AppConfig(
    webAppUrl: AppConstants.websiteUrl,
  );

  static Future<AppConfig> fetchConfig() async {
    try {
      final response = await http
          .get(
            Uri.parse(AppConstants.flutterConfigApi),
            headers: {'Accept': 'application/json'},
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final config = AppConfig.fromJson(data);

        // تأكد من وجود رابط الموقع
        final finalConfig = config.webAppUrl.isNotEmpty
            ? config
            : AppConfig(
                splashEnabled: config.splashEnabled,
                splashImageUrl: config.splashImageUrl,
                splashImageUrl2: config.splashImageUrl2,
                splashTitle: config.splashTitle,
                splashSubtitle: config.splashSubtitle,
                splashBackgroundColor: config.splashBackgroundColor,
                splashDuration: config.splashDuration,
                appName: config.appName,
                appVersion: config.appVersion,
                primaryColor: config.primaryColor,
                secondaryColor: config.secondaryColor,
                accentColor: config.accentColor,
                logoUrl: config.logoUrl,
                webAppUrl: AppConstants.websiteUrl,
                storeStatus: config.storeStatus,
                privacyPolicyText: config.privacyPolicyText,
              );

        _cachedConfig = finalConfig;

        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_cacheKey, jsonEncode(finalConfig.toJson()));
        } catch (_) {}

        return finalConfig;
      }
    } catch (e) {
      // محاولة تحميل من الكاش
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString(_cacheKey);
      if (cached != null) {
        final data = jsonDecode(cached) as Map<String, dynamic>;
        final config = AppConfig.fromJson(data);
        _cachedConfig = config;
        return config;
      }
    } catch (_) {}

    return defaultConfig;
  }

  static AppConfig get current => _cachedConfig ?? defaultConfig;

  static int hexToColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return int.parse(hex, radix: 16);
  }
}
