const CACHE_NAME = 'dashboard-v3'; // تم تحديث النسخة للتأكد من مسح الكاش القديم
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

// 1. التثبيت وحفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching all assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. التفعيل وحذف أجهزة الكاش القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. معالجة الطلبات (Stale-While-Revalidate / Cache Fallback)
self.addEventListener('fetch', (event) => {
  // تجنب معالجة الطلبات الخاصة بالـ Firebase أو الخوادم الخارجية إن وجدت
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // محاولة تجديد البيانات من الشبكة في الخلفية
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // في حالة عدم وجود شبكة (Offline)، ارجع لصفحة index.html
        return caches.match('./index.html');
      });

      // ارجع بالنسخة الكاش فوراً لو موجودة، أو انتظر نتيجة الشبكة
      return cachedResponse || fetchPromise;
    })
  );
});