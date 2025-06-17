const CACHE_NAME = 'akilli-sepet-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install Event - Cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Cached all files successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then(response => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Push Event - Handle push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: 'AkıllıSepet\'ten yeni bir bildirim!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Uygulamayı Aç',
        icon: './icon-192.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: './icon-192.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'AkıllıSepet';
  }

  event.waitUntil(
    self.registration.showNotification('AkıllıSepet', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
    );
  }
});

// Background Sync Event
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      syncData()
    );
  }
});

// Sync data function
async function syncData() {
  try {
    // Get data from IndexedDB or localStorage
    const data = await getOfflineData();
    
    if (data && data.length > 0) {
      // Send data to server when online
      await sendDataToServer(data);
      // Clear offline data after successful sync
      await clearOfflineData();
    }
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// Helper functions for data management
async function getOfflineData() {
  // Implementation for getting offline data
  return [];
}

async function sendDataToServer(data) {
  // Implementation for sending data to server
  console.log('Service Worker: Sending data to server', data);
}

async function clearOfflineData() {
  // Implementation for clearing offline data
  console.log('Service Worker: Clearing offline data');
}

// Message Event - Handle messages from main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error Event
self.addEventListener('error', event => {
  console.error('Service Worker: Error occurred', event.error);
});

// Unhandled Rejection Event
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
});
