// lib/providers/auth_provider.dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  AppUser? _user;
  bool _isLoading = false;

  AppUser? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString('user_data');
      if (userData != null) {
        _user = AppUser.fromJson(jsonDecode(userData));
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<Map<String, dynamic>> login(String identifier, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final result = await ApiService.login(identifier, password);
      if (result['success'] == true) {
        final userData = result['user'] ?? result;
        if (userData is Map<String, dynamic>) {
          _user = AppUser.fromJson(userData);
          await _saveToStorage();
        }
      }
      return result;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> register(String name, String phone, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final result = await ApiService.register(name, phone, password);
      if (result['success'] == true) {
        final userData = result['user'] ?? result;
        if (userData is Map<String, dynamic>) {
          _user = AppUser.fromJson(userData);
          await _saveToStorage();
        }
      }
      return result;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> guestLogin(String name, String phone) async {
    _isLoading = true;
    notifyListeners();
    try {
      final result = await ApiService.guestAuth(name, phone);
      if (result['success'] == true) {
        final data = Map<String, dynamic>.from(result);
        data.remove('success');
        _user = AppUser.fromJson(data);
        await _saveToStorage();
      }
      return result;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _saveToStorage() async {
    if (_user == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode(_user!.toJson()));
    await prefs.setString('customer_phone', _user!.phone);
    await prefs.setString('customer_name', _user!.name);
  }

  Future<void> logout() async {
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
    await prefs.remove('customer_phone');
    await prefs.remove('customer_name');
    notifyListeners();
  }
}
