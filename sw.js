const CACHE_NAME = 'dashboard-v4'; // تحديث النسخة لتفعيل الملفات الجديدة

// القائمة الكاملة لكل ملفات التطبيق ليتم حفظها للعمل بدون إنترنت (Offline)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './azan.mp3'
];

// 1. تثبيت الـ Service Worker وحفظ كافة المرفقات في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching all assets successfully...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. التفعيل ومسح أي كاش قديم لضمان تحديث التطبيق فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. معالجة الطلبات وتشغيل التطبيق من الكاش في حالة الأوفلاين
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات الخارجية غير التابعة لنفس النطاق
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // في حالة قطع الإنترت، يتم استدعاء الصفحة المحفوظة
        return caches.match('./index.html');
      });

      return cachedResponse || fetchPromise;
    })
  );
});
