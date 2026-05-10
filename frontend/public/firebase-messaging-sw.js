/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyASFiLs-5AHTAZdjthigDjLLXFTx-w8TUg',
  authDomain: 'juaravibecoding-337f9.firebaseapp.com',
  projectId: 'juaravibecoding-337f9',
  messagingSenderId: '22923549407',
  appId: '1:22923549407:web:6206a9907e32787442276a',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Notifikasi Baru';
  const body = payload?.notification?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload?.data || {},
    tag: 'saleshub-' + Date.now(),
  });
});

// Klik notifikasi -> buka app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Kalau sudah ada tab terbuka, fokus ke situ
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Kalau belum ada tab, buka baru
      return clients.openWindow(urlToOpen);
    })
  );
});
