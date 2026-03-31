// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  final bool isRegister;
  const LoginScreen({super.key, this.isRegister = false});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  late bool _isRegister;
  bool _isGuest = false;
  bool _showPassword = false;

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _isRegister = widget.isRegister;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    Map<String, dynamic> result;

    if (_isGuest) {
      result = await auth.guestLogin(_nameController.text.trim(), _phoneController.text.trim());
    } else if (_isRegister) {
      result = await auth.register(_nameController.text.trim(), _phoneController.text.trim(), _passwordController.text.trim());
    } else {
      result = await auth.login(_phoneController.text.trim(), _passwordController.text.trim());
    }

    if (mounted) {
      if (result['success'] == true || auth.isAuthenticated) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isRegister ? 'تم إنشاء الحساب بنجاح! 🎉' : 'مرحباً بك! 👋'),
          backgroundColor: const Color(0xFF4CAF50),
        ));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(result['message']?.toString() ?? 'حدث خطأ. تحقق من البيانات'),
          backgroundColor: Colors.red,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(icon: const Icon(Icons.close, color: Colors.black), onPressed: () => Navigator.pop(context)),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFFE53935), Color(0xFF4CAF50)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('طمطوم', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 28)),
                ),
              ),
              const SizedBox(height: 32),

              // Toggle guest / normal
              Container(
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  Expanded(child: GestureDetector(
                    onTap: () => setState(() => _isGuest = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: !_isGuest ? const Color(0xFFE53935) : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(_isRegister ? 'إنشاء حساب' : 'تسجيل الدخول', textAlign: TextAlign.center, style: TextStyle(color: !_isGuest ? Colors.white : Colors.grey, fontWeight: FontWeight.bold)),
                    ),
                  )),
                  Expanded(child: GestureDetector(
                    onTap: () => setState(() { _isGuest = true; _isRegister = false; }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _isGuest ? const Color(0xFFE53935) : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text('بدون حساب', textAlign: TextAlign.center, style: TextStyle(color: _isGuest ? Colors.white : Colors.grey, fontWeight: FontWeight.bold)),
                    ),
                  )),
                ]),
              ),

              const SizedBox(height: 28),

              if (!_isGuest && !_isRegister) ...[
                Text('مرحباً بعودتك!', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('سجّل دخولك للمتابعة', style: TextStyle(color: Colors.grey.shade600)),
              ] else if (!_isGuest && _isRegister) ...[
                Text('إنشاء حساب جديد', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('انضم إلينا الآن', style: TextStyle(color: Colors.grey.shade600)),
              ] else ...[
                Text('متابعة بدون حساب', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('أدخل اسمك ورقم هاتفك', style: TextStyle(color: Colors.grey.shade600)),
              ],

              const SizedBox(height: 24),

              if (_isRegister || _isGuest)
                _buildField('الاسم الكامل', _nameController, Icons.person_outline, (v) {
                  if (v == null || v.trim().isEmpty) return 'الاسم مطلوب';
                  if (v.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
                  return null;
                }),
              if (_isRegister || _isGuest) const SizedBox(height: 14),

              _buildField(
                'رقم الهاتف',
                _phoneController,
                Icons.phone_outlined,
                (v) {
                  if (v == null || v.trim().isEmpty) return 'رقم الهاتف مطلوب';
                  if (v.trim().length < 8) return 'رقم هاتف غير صحيح';
                  return null;
                },
                keyboardType: TextInputType.phone,
              ),

              if (!_isGuest) ...[
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordController,
                  obscureText: !_showPassword,
                  textDirection: TextDirection.rtl,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'كلمة المرور مطلوبة';
                    if (_isRegister && v.trim().length < 6) return 'يجب أن تكون 6 أحرف على الأقل';
                    return null;
                  },
                  decoration: InputDecoration(
                    labelText: 'كلمة المرور',
                    prefixIcon: const Icon(Icons.lock_outline, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility, size: 20),
                      onPressed: () => setState(() => _showPassword = !_showPassword),
                    ),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE53935))),
                  ),
                ),
              ],

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE53935),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: isLoading ? null : _submit,
                  child: isLoading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(
                          _isGuest ? 'متابعة' : (_isRegister ? 'إنشاء الحساب' : 'تسجيل الدخول'),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),

              if (!_isGuest) ...[
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => setState(() => _isRegister = !_isRegister),
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(color: Colors.grey),
                        children: [
                          TextSpan(text: _isRegister ? 'لديك حساب؟ ' : 'ليس لديك حساب؟ '),
                          TextSpan(
                            text: _isRegister ? 'تسجيل الدخول' : 'إنشاء حساب',
                            style: const TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ]),
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController ctrl, IconData icon, String? Function(String?) validator, {TextInputType? keyboardType}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboardType,
      textDirection: TextDirection.rtl,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE53935))),
      ),
    );
  }
}
