// lib/services/permission_service.dart
// خدمة إدارة الصلاحيات

import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/material.dart';

class PermissionService {
  // طلب جميع الصلاحيات المطلوبة
  static Future<void> requestAllPermissions(BuildContext context) async {
    // قائمة الصلاحيات المطلوبة
    final List<Permission> permissions = [
      Permission.location,
      Permission.locationWhenInUse,
      Permission.camera,
      Permission.storage,
      Permission.phone,
      Permission.sms,
    ];
    
    // طلب الصلاحيات
    await permissions.request();
    
    // التحقق من الصلاحيات المرفوضة بشكل دائم
    bool hasPermanentlyDenied = false;
    for (var permission in permissions) {
      if (await permission.isPermanentlyDenied) {
        hasPermanentlyDenied = true;
        debugPrint('Permission ${permission.toString()} is permanently denied');
      }
    }
    
    // إذا كان هناك صلاحيات مرفوضة بشكل دائم، عرض حوار
    if (hasPermanentlyDenied && context.mounted) {
      _showOpenSettingsDialog(context);
    }
  }
  
  // عرض حوار لفتح إعدادات التطبيق
  static void _showOpenSettingsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('الصلاحيات المطلوبة'),
        content: const Text(
          'بعض الصلاحيات مطلوبة لتحسين تجربة الاستخدام. '
          'يرجى تفعيل الصلاحيات من إعدادات الجهاز.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('تجاهل'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await openAppSettings(); // Calls package function
            },
            child: const Text('فتح الإعدادات'),
          ),
        ],
      ),
    );
  }
  
  // التحقق من صلاحية الموقع
  static Future<bool> isLocationPermissionGranted() async {
    return await Permission.location.isGranted;
  }
  
  // التحقق من صلاحية التخزين
  static Future<bool> isStoragePermissionGranted() async {
    return await Permission.storage.isGranted;
  }
  
  // فتح إعدادات التطبيق
  static Future<void> openSystemSettings() async {
    await openAppSettings();
  }
}