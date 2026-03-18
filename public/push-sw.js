/**
 * Push Notification Service Worker
 * Handles push events and notification clicks
 */

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'SimulaIOAB',
      body: event.data.text(),
      icon: '/logo.png',
    };
  }

  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'simulai-notification',
    data: {
      url: data.url || '/dashboard',
    },
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SimulaIOAB', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  // Handle action button clicks
  if (event.action === 'practice') {
    event.waitUntil(clients.openWindow('/practice'));
    return;
  }

  if (event.action === 'review') {
    event.waitUntil(clients.openWindow('/revisao-inteligente'));
    return;
  }

  // Default: open the URL from notification data
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise, open a new window
      return clients.openWindow(url);
    })
  );
});
