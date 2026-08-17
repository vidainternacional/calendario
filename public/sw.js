const CACHE_NAME = 'vida-shell-v2.1-notas-origen'
const OFFLINE_NOTES_SHELL = '/offline/notas.html'
const OFFLINE_NOTES_OWNER_MARKER = '/offline/notas-owner'
const OWNER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SHELL_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  OFFLINE_NOTES_SHELL,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  )
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || typeof data.type !== 'string') return

  if (data.type === 'VIDA_NOTES_OWNER_SET' && OWNER_UUID_RE.test(data.userId || '')) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) =>
        cache.put(
          OFFLINE_NOTES_OWNER_MARKER,
          new Response(data.userId, {
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          })
        )
      )
    )
    return
  }

  if (data.type === 'VIDA_NOTES_OWNER_CLEAR') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.delete(OFFLINE_NOTES_OWNER_MARKER))
    )
  }
})

async function respuestaNotasOffline() {
  const cache = await caches.open(CACHE_NAME)
  const shell = await cache.match(OFFLINE_NOTES_SHELL)
  if (!shell) return Response.error()

  const ownerResponse = await cache.match(OFFLINE_NOTES_OWNER_MARKER)
  if (!ownerResponse) return shell

  const ownerId = (await ownerResponse.text()).trim()
  if (!OWNER_UUID_RE.test(ownerId)) return shell

  const html = await shell.text()
  const ownerBootstrap = `<script>try{localStorage.setItem('vida-biblia-notas-active-owner-v1',${JSON.stringify(ownerId)})}catch{}</script>`
  const headers = new Headers(shell.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')
  headers.set('content-type', 'text/html; charset=utf-8')

  return new Response(html.replace('<head>', `<head>${ownerBootstrap}`), {
    status: shell.status,
    statusText: shell.statusText,
    headers,
  })
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  if (event.request.mode === 'navigate') {
    const pathname = url.pathname.replace(/\/+$/, '') || '/'

    if (url.origin === self.location.origin && pathname === '/biblia/notas') {
      event.respondWith(
        fetch(event.request).catch(() => respuestaNotasOffline())
      )
    }
    return
  }

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.hostname.includes('supabase.co')
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: 'Vida Internacional',
      body: event.data.text(),
      url: '/inicio',
      tag: `vida-${Date.now()}`,
      renotify: true,
    }
  }

  const tag = payload.tag || `vida-${Date.now()}`
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-maskable-192.png',
    tag,
    renotify: payload.renotify !== false,
    data: { url: payload.url || '/inicio' },
    requireInteraction: false,
    silent: false,
    timestamp: Date.now(),
    lang: 'es',
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || 'Vida Internacional', options),
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'VIDA_PUSH_RECEIVED', tag, url: options.data.url })
        })
      }),
    ])
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/inicio'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) await client.navigate(targetUrl)
          return client.focus()
        }
      }

      if (clients.openWindow) return clients.openWindow(targetUrl)
      return undefined
    })
  )
})
