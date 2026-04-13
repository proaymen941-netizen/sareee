const CACHE_NAME = 'saree-one-v3';

// الملفات التي يجب تخزينها مؤقتاً
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];

// قائمة الروابط المسموح بها للاتصال المباشر
const ALLOWED_EXTERNAL_URLS = [
  'https://wa.me/',
  'https://api.whatsapp.com/',
  'tel:',
  'mailto:'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.log('Cache addAll error:', error);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// دالة للتحقق إذا كان الرابط خارجياً مسموحاً به
function isAllowedExternalUrl(url) {
  return ALLOWED_EXTERNAL_URLS.some(allowed => url.startsWith(allowed));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // السماح بطلبات واتساب والاتصال المباشر
  if (isAllowedExternalUrl(request.url)) {
    return;
  }

  // لا نتدخل في طلبات POST أو API أو WebSocket
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/uploads/')) return;

  // استراتيجية: الشبكة أولاً، ثم الكاش
  event.respondWith(
    fetch(request)
      .then((response) => {
        // تخزين الردود الناجحة مؤقتاً
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // عند فشل الشبكة، استخدم الكاش
        const cached = await caches.match(request);
        if (cached) return cached;
        
        // للتنقل، أرجع الصفحة الرئيسية
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;
          return caches.match('/');
        }
        
        return new Response('غير متصل بالإنترنت', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// الاستماع لرسائل من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});