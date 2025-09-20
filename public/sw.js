const CACHE_NAME = 'qcc-it-tracker-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/devices',
  '/dashboard/repairs',
  '/dashboard/service-desk',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/images/qcc-logo.png',
  '/manifest.json'
]

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Push notification
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/images/qcc-logo.png',
    badge: '/images/qcc-logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('QCC IT Tracker', options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('On notification click: ', event.notification.tag)
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/dashboard')
  )
})