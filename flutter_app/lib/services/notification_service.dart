import 'dart:convert';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  final notificationService = NotificationService();
  await notificationService.showLocalNotification(
    title: message.notification?.title ?? 'طمطوم',
    body: message.notification?.body ?? '',
    payload: jsonEncode(message.data),
  );
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  static const String _baseUrl = 'https://tamtomsture.onrender.com';
  static const String _tokenKey = 'fcm_device_token';

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'tamtom_high_importance',
    'إشعارات طمطوم',
    description: 'إشعارات المتجر والطلبات',
    importance: Importance.max,
    enableVibration: true,
    playSound: true,
  );

  Future<void> initialize() async {
    // Local notifications init
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings =
        InitializationSettings(android: androidSettings, iOS: iosSettings);

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        _handleNotificationTap(details.payload);
      },
    );

    // Create Android notification channel
    final androidPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_channel);

    // Firebase Messaging setup
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Request permission
    await _requestPermission();

    // Listen to foreground messages
    FirebaseMessaging.onMessage.listen((message) {
      showLocalNotification(
        title: message.notification?.title ?? 'طمطوم',
        body: message.notification?.body ?? '',
        payload: jsonEncode(message.data),
      );
    });

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleNotificationTap(jsonEncode(message.data));
    });

    // Get and register token
    await _registerToken();

    // Listen for token refresh
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      _saveAndSendToken(newToken);
    });
  }

  Future<void> _requestPermission() async {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    print('FCM Permission: ${settings.authorizationStatus}');
  }

  Future<void> _registerToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _saveAndSendToken(token);
      }
    } catch (e) {
      print('Error getting FCM token: $e');
    }
  }

  Future<void> _saveAndSendToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final oldToken = prefs.getString(_tokenKey);
      if (oldToken == token) return;

      await prefs.setString(_tokenKey, token);

      final response = await http.post(
        Uri.parse('$_baseUrl/api/flutter/register-token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'token': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
        }),
      );
      print('Token registered: ${response.statusCode}');
    } catch (e) {
      print('Error sending FCM token: $e');
    }
  }

  Future<void> deregisterToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_tokenKey);
      if (token == null) return;

      await http.post(
        Uri.parse('$_baseUrl/api/flutter/deregister-token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': token}),
      );
      await prefs.remove(_tokenKey);
    } catch (e) {
      print('Error deregistering token: $e');
    }
  }

  Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
    int id = 0,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      _channel.id,
      _channel.name,
      channelDescription: _channel.description,
      importance: Importance.max,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      styleInformation: BigTextStyleInformation(body),
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    final details = NotificationDetails(android: androidDetails, iOS: iosDetails);
    await _localNotifications.show(id, title, body, details, payload: payload);
  }

  void _handleNotificationTap(String? payload) {
    if (payload != null) {
      try {
        final data = jsonDecode(payload);
        print('Notification tapped: $data');
        // Navigation can be added here
      } catch (_) {}
    }
  }
}
