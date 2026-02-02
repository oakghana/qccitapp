// Unregister Service Worker Script
// Run this in your browser console (F12) to unregister the old service worker

(async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    console.log('Found', registrations.length, 'service worker(s)');
    
    for (let registration of registrations) {
      const success = await registration.unregister();
      console.log('Unregistered service worker:', success);
    }
    
    // Clear all caches
    const cacheNames = await caches.keys();
    console.log('Found', cacheNames.length, 'cache(s)');
    
    for (let cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('Deleted cache:', cacheName);
    }
    
    console.log('✅ All service workers unregistered and caches cleared!');
    console.log('Please refresh the page (Ctrl+R or F5)');
  } else {
    console.log('❌ Service workers not supported');
  }
})();
