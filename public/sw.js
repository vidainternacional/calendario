const CACHE_NAME = 'vida-shell-v1'
const SHELL_ASSETS = [
  '/',
  '/inicio',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return

  // No cachear API calls ni Supabase
  const url = new URL(event.request.url)
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co')
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request)
    })
  )
})
