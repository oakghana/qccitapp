const CACHE_NAME = 'qcc-it-tracker-v2'
const STATIC_CACHE = 'qcc-static-v2'
const DYNAMIC_CACHE = 'qcc-dynamic-v2'
const OFFLINE_PAGE = '/offline'

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/devices',
  '/dashboard/repairs',
  '/dashboard/service-desk',
  '/dashboard/notifications',
  '/dashboard/complaints',
  '/dashboard/assigned-repairs',
  '/dashboard/analytics',
  '/dashboard/users',
  '/dashboard/system-settings',
  '/images/qcc-logo.png',
  '/placeholder-logo.png',
  '/placeholder-logo.svg',
  '/placeholder-user.jpg',
  '/manifest.json'
]

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      // Cache offline page
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching offline page')
        return cache.add(OFFLINE_PAGE)
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete')
      return self.skipWaiting()
    })
  )
})

// Activate service worker and clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE]
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activation complete')
      return self.clients.claim()
    })
  )
})

// Enhanced fetch strategy with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests
  if (url.origin !== location.origin) return

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      handleNavigationRequest(request)
    )
    return
  }

  // Handle static assets
  if (isStaticAsset(request.url)) {
    event.respondWith(
      handleStaticAsset(request)
    )
    return
  }

  // Handle API requests
  if (request.url.includes('/api/') || request.url.includes('/_next/')) {
    event.respondWith(
      handleDynamicRequest(request)
    )
    return
  }

  // Default: cache-first strategy
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        console.log('Service Worker: Serving from cache:', request.url)
        return response
      }
      
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone and cache the response
        const responseToCache = response.clone()
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseToCache)
        })

        return response
      }).catch(() => {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE)
        }
        // Return a simple offline response for other requests
        return new Response('Offline - Please check your internet connection', {
          status: 503,
          statusText: 'Service Unavailable'
        })
      })
    })
  )
})

// Handle navigation requests (pages)
async function handleNavigationRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Service Worker: Serving page from cache:', request.url)
      return cachedResponse
    }

    // Try network
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      // Cache successful response
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Network failed, serving offline page')
    return caches.match(OFFLINE_PAGE)
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Service Worker: Serving static asset from cache:', request.url)
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }

    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Static asset not available:', request.url)
    return new Response('Asset not available offline', { status: 404 })
  }
}

// Handle dynamic requests (API, etc.)
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      // Cache successful API responses for short time
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    // Try to serve from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Service Worker: Serving API response from cache:', request.url)
      return cachedResponse
    }
    
    // Return offline data structure for API calls
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Check if request is for static asset
function isStaticAsset(url) {
  return url.includes('/_next/static/') || 
         url.includes('/images/') ||
         url.includes('/icons/') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.jpeg') ||
         url.includes('.svg') ||
         url.includes('.css') ||
         url.includes('.js')
}

// Enhanced push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  let notificationData = {}
  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (e) {
      notificationData = { body: event.data.text() }
    }
  }

  const options = {
    body: notificationData.body || 'New notification from QCC IT Tracker',
    icon: '/images/qcc-logo.png',
    badge: '/images/qcc-logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: notificationData.id || 1,
      url: notificationData.url || '/dashboard'
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/images/qcc-logo.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/images/qcc-logo.png'
      }
    ],
    requireInteraction: true,
    persistent: true
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'QCC IT Tracker', 
      options
    )
  )
})

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received', event.action)
  
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('Service Worker: Performing background sync')
  // Here you can implement logic to sync offline data when connection is restored
  try {
    // Example: sync pending form submissions, notifications, etc.
    const cache = await caches.open(DYNAMIC_CACHE)
    // Add your sync logic here
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error)
  }
}

console.log('Service Worker: Script loaded')
