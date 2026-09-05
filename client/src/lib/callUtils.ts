/**
 * أداة إدارة الاتصال الصوتي والتواصل الآمن المتوافق مع تطبيقات Android WebView و PWA والمتصفحات
 */

export interface PhoneInfo {
  raw: string;
  display: string;
  cleanDigits: string;
  international: string;
}

export function formatYemenPhone(phoneStr: string): PhoneInfo {
  if (!phoneStr) {
    return { raw: '', display: '', cleanDigits: '', international: '' };
  }

  const digits = phoneStr.replace(/\D/g, '');
  let local = digits;
  let intl = digits;

  if (digits.startsWith('00967')) {
    intl = digits.substring(2);
    local = digits.substring(5);
  } else if (digits.startsWith('967')) {
    intl = digits;
    local = digits.substring(3);
  } else if (digits.startsWith('0')) {
    local = digits.substring(1);
    intl = '967' + local;
  } else {
    local = digits;
    intl = '967' + digits;
  }

  return {
    raw: phoneStr,
    display: local || phoneStr,
    cleanDigits: digits,
    international: intl
  };
}

/**
 * تنفيذ فتح لوحة الاتصال بطريقة آمنة
 * - في بيئة Android WebView، استخدام window.open("tel:...") أو window.location.href = "tel:..."
 *   يتسبب في خطأ net::ERR_UNKNOWN_URL_SCHEME إذا لم يكن الـ WebView مهيأ لاعتراض tel:
 * - استخدام عنصر iframe مخفي يرسل Intent الاتصال لنظام أندرويد دون تغيير صفحة الويب الحالية،
 *   فإن كان الـ WebView يدعمها فتح الاتصال، وإن لم يدعمها لا تتأثر الصفحة أبداً!
 */
export function safeTriggerPhoneCall(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleaned) return false;

  const telUrl = `tel:${cleaned}`;

  try {
    // 1. استخدام iframe مخفي لتفادي ERR_UNKNOWN_URL_SCHEME على Android WebView
    let iframe = document.getElementById('driver-safe-tel-frame') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'driver-safe-tel-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);
    }
    iframe.src = telUrl;
    return true;
  } catch (e) {
    console.warn('⚠️ فشل تشغيل iframe للاتصال:', e);
    return false;
  }
}

/**
 * إنشاء رابط واتساب متوافق مع كافة الأنظمة
 */
export function getWhatsAppLink(phoneNumber: string, message?: string): string {
  const info = formatYemenPhone(phoneNumber);
  const target = info.international || phoneNumber.replace(/\D/g, '');
  const encoded = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${target}${encoded ? `?text=${encoded}` : ''}`;
}

/**
 * نسخ رقم الهاتف أو أي نص إلى الحافظة بنجاح
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}

  // Fallback for non-secure contexts or older WebViews
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
