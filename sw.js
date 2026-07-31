const CACHE_NAME = 'dashboard-v6';

// اقتصار الكاش في البداية على الملفات الأساسية فقط لضمان التثبيت الفوري
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 1. تثبيت فوري وتخطي الانتظار
self.addEventListener('install', (event) => {
  self.skipWaiting(); // تجبر المتصفح يفعل الـ SW فوراً بدون تعليق
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. تفعيل وتنظيف أي كاش قديم مع السيطرة الفورية على الصفحات
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // سيطرة فورية على التطبيق
  );
});

// 3. استراتيجية الشبكة أولاً مع حماية من الأخطاء
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && event.request.url.startsWith('http')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
