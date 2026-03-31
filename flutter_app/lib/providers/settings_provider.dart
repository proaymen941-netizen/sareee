// lib/providers/settings_provider.dart
import 'package:flutter/foundation.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';

class SettingsProvider extends ChangeNotifier {
  UiSettings _settings = const UiSettings();
  bool _loaded = false;

  UiSettings get settings => _settings;
  bool get loaded => _loaded;

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
}
