# Clear Service Worker - Complete Guide

The app is experiencing "Failed to fetch" errors due to the service worker intercepting API calls.

## Quick Fix (Run in Browser Console - F12)

```javascript
// Paste this into browser console and press Enter:
(async () => {
  // Unregister all service workers
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (let registration of registrations) {
    await registration.unregister();
    console.log('✅ Unregistered:', registration.scope);
  }
  
  // Delete all caches
  const cacheNames = await caches.keys();
  for (let name of cacheNames) {
    await caches.delete(name);
    console.log('✅ Deleted cache:', name);
  }
  
  // Clear localStorage
  localStorage.clear();
  console.log('✅ Cleared localStorage');
  
  console.log('🎉 ALL CLEARED! Now do a HARD REFRESH:');
  console.log('   Windows: Ctrl + Shift + R');
  console.log('   Mac: Cmd + Shift + R');
})();
```

## Manual Steps (If script doesn't work)

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Service Workers** (left sidebar)
   - Click "Unregister" for each service worker
4. **Storage** (left sidebar)
   - Click "Clear site data"
   - Check all boxes
   - Click "Clear site data" button
5. **Hard Refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## What Was Fixed

- ✅ Service worker now bypasses critical APIs
- ✅ Auto-unregisters on page load via `/unregister-sw.js`
- ✅ `cache: 'no-store'` added to fetch calls
- ✅ Toast error syntax fixed

## After Clearing

The assign ticket dialog should now load all 35 IT staff members successfully!
