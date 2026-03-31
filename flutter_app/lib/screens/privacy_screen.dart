import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PrivacyScreen extends StatelessWidget {
  final String content;
  const PrivacyScreen({Key? key, required this.content}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'سياسة الخصوصية',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF4CAF50),
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Directionality(
          textDirection: TextDirection.rtl,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Text(
                content.isNotEmpty
                    ? content
                    : _defaultPrivacyPolicy,
                style: GoogleFonts.cairo(
                  fontSize: 15,
                  height: 1.8,
                  color: Color(0xFF333333),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static const String _defaultPrivacyPolicy = '''
سياسة الخصوصية - تطبيق طمطوم

آخر تحديث: مارس 2026

مرحباً بكم في تطبيق طمطوم. نحن نلتزم بحماية خصوصيتكم وأمان بياناتكم الشخصية.

١. المعلومات التي نجمعها:
نجمع المعلومات الضرورية لتقديم خدماتنا، بما في ذلك:
• معلومات الاتصال (الاسم، رقم الهاتف)
• معلومات الطلبات والتوصيل
• بيانات الجهاز لأغراض الإشعارات

٢. كيفية استخدام المعلومات:
• معالجة وتتبع الطلبات
• إرسال إشعارات حالة الطلب
• تحسين خدماتنا وتجربة المستخدم

٣. مشاركة المعلومات:
نحن لا نبيع أو نؤجر معلوماتكم الشخصية لأطراف ثالثة.

٤. الإشعارات:
نستخدم خدمة الإشعارات لإعلامكم بحالة طلباتكم والعروض الخاصة. يمكنكم إلغاء الاشتراك في الإشعارات من إعدادات الجهاز.

٥. التخزين المحلي:
يحتفظ التطبيق ببعض البيانات محلياً على جهازكم لتحسين الأداء وتجربة الاستخدام دون اتصال.

٦. حقوقكم:
يحق لكم الوصول إلى بياناتكم أو تصحيحها أو حذفها في أي وقت عبر التواصل معنا.

٧. التواصل:
للاستفسارات المتعلقة بالخصوصية، تواصلوا معنا عبر تطبيق طمطوم.
''';
}
