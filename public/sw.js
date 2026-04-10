// public/sw.js — Service Worker VCEL PWA
const CACHE_NAME = 'vcel-v1'
const OFFLINE_URL = '/offline'

// Assets à mettre en cache au premier chargement
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/logo.png',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ── Installation ──────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Silencieux si certains assets manquent
      })
    })
  )
  self.skipWaiting()
})

// ── Activation ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch — stratégie Network First avec fallback cache ───────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-HTTP, extensions, et API
  if (
    !request.url.startsWith('http') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    request.method !== 'GET'
  ) {
    return
  }

  // Pages de navigation → Network first, fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(r => r || new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  // Assets statiques → Cache first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2|woff|css)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          }
          return response
        }).catch(() => cached || new Response('', { status: 404 }))
      })
    )
    return
  }

  // Tout le reste → Network only
  event.respondWith(fetch(request))
})

// ── Push notifications (pour plus tard) ──────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'VCEL', {
      body:  data.body  || '',
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data:  data.url ? { url: data.url } : {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})