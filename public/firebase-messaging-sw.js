// NEXA Firebase Cloud Messaging & Web Push Service Worker
/* eslint-disable no-restricted-globals */

// Import Firebase compat scripts safely
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  firebase.initializeApp({
    apiKey: 'AIzaSyDemoNexaAppKeySafeConfig12345',
    authDomain: 'nexa-social-app.firebaseapp.com',
    projectId: 'nexa-social-app',
    storageBucket: 'nexa-social-app.appspot.com',
    messagingSenderId: '1029384756',
    appId: '1:1029384756:web:abcd1234efgh5678'
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload);
    const title = payload.notification?.title || payload.data?.title || 'NEXA';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Anda memiliki notifikasi baru di NEXA',
      icon: payload.notification?.icon || payload.data?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || { url: '/' },
      tag: payload.data?.tag || `nexa-push-${Date.now()}`,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Buka NEXA' },
        { action: 'dismiss', title: 'Tutup' }
      ]
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} catch (err) {
  console.log('[FCM SW] Running in standard Web Push event mode:', err);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Standard Web Push Event Listener (handles both standard Web Push and custom dispatch)
self.addEventListener('push', (event) => {
  let data = {
    title: 'NEXA',
    body: 'Anda memiliki notifikasi baru di NEXA',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        title: parsed.notification?.title || parsed.title || data.title,
        body: parsed.notification?.body || parsed.body || data.body,
        icon: parsed.notification?.icon || parsed.icon || data.icon,
        badge: parsed.badge || data.badge,
        data: parsed.data || { url: parsed.url || '/' },
        tag: parsed.tag || `nexa-push-${Date.now()}`
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: data.data,
    tag: data.tag || 'nexa-notification',
    renotify: true,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Buka NEXA' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Notification Click Handler (Deep Linking & Navigation)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const payloadData = event.notification.data || {};
  let targetUrl = payloadData.url || '/';

  if (payloadData.postId || payloadData.post_id) {
    const pId = payloadData.postId || payloadData.post_id;
    targetUrl = `/?post=${pId}`;
  } else if (payloadData.type === 'message' || payloadData.conversationId || payloadData.conversation_id) {
    targetUrl = `/?view=messages`;
  } else if (payloadData.type === 'follow' || payloadData.actorId || payloadData.actor_id) {
    targetUrl = `/?view=notifications`;
  } else if (payloadData.type === 'system') {
    targetUrl = `/?view=notifications`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NEXA_NOTIFICATION_CLICK',
            data: payloadData
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
