// lib/providers/settings_provider.dart
// مزود الإعدادات مع التحديث التلقائي الدوري

import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class SettingsProvider extends ChangeNotifier {
  UiSettings _settings = const UiSettings();
  bool _loaded = false;
  int _lastKnownVersion = 0;
  Timer? _syncTimer;

  UiSettings get settings => _settings;
  bool get loaded => _loaded;

  SettingsProvider() {
    _startPeriodicSync();
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }

  // تحميل الإعدادات مرة واحدة
  Future<void> load() async {
    try {
      _settings = await ApiService.getUiSettings();
      _loaded = true;
      notifyListeners();
    } catch (_) {
      _loaded = true;
      notifyListeners();
    }
  }

  // التحقق الدوري من وجود تحديثات للإعدادات
  void _startPeriodicSync() {
    _syncTimer = Timer.periodic(
      Duration(seconds: AppConstants.settingsCheckIntervalSeconds),
      (_) => _checkForUpdates(),
    );
  }

  Future<void> _checkForUpdates() async {
    try {
      final version = await ApiService.getSettingsVersion();
      if (version > _lastKnownVersion) {
        _lastKnownVersion = version;
        await load();
      }
    } catch (_) {}
  }

  // إعادة تحميل الإعدادات يدوياً (مثلاً بعد تغيير المشرف)
  Future<void> reload() async {
    _lastKnownVersion = 0;
    await load();
  }
}
