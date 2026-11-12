/**
 * M02 — Service Worker hỗ trợ đóng gói ứng dụng độc lập (PWA) & hoạt động Offline-first
 * Phục vụ: F12, C01, C05, AC09
 */

const CACHE_NAME = 'glowbar-pwa-cache-v5';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/styles/main.css',
  './src/core/models.js',
  './src/core/calculator.js',
  './src/core/glow.js',
  './src/core/timer.js',
  './src/services/sync.js',
  './src/ui/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Tuyệt đối không can thiệp vào luồng kết nối thời gian thực của Firebase / Firestore hoặc CDN bên ngoài
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Chiến lược Network-First (Ưu tiên mạng khi Online, tự động rơi về Cache khi Offline)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

