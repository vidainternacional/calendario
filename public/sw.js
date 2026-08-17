const CACHE_NAME = 'vida-shell-v2.3-cuaderno-react-real'
const OFFLINE_NOTES_APP = '/biblia/notas-offline'
const OFFLINE_NOTES_OWNER_MARKER = '/offline/notas-owner'
const OWNER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SHELL_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

function staticAssetUrlsFromHtml(html) {
  const urls = new Set()
  for (const match of html.matchAll(/(?:src|href)=["']([^"']*\/_next\/static\/[^"']+)["']/g)) {
    try {
      const url = new URL(match[1], self.location.origin)
      if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) urls.add(url.toString())
    } catch {}
  }
  return Array.from(urls)
}

function nestedStaticUrlsFromCss(css, cssUrl) {
  const urls = new Set()
  for (const match of css.matchAll(/url\((['"]?)([^)'"\s]+)\1\)/g)) {
    try {
      const url = new URL(match[2], cssUrl)
      if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) urls.add(url.toString())
    } catch {}
  }
  return Array.from(urls)
}

async function cacheStaticAsset(cache, assetUrl) {
  const request = new Request(assetUrl, { credentials: 'same-origin' })
  const response = await fetch(request, { cache: 'reload' })
  if (!response.ok) return

  await cache.put(request, response.clone())

  const url = new URL(assetUrl)
  if (!url.pathname.endsWith('.css')) return

  const css = await response.text()
  const nested = nestedStaticUrlsFromCss(css, url)
  await Promise.allSettled(nested.map(async (nestedUrl) => {
    const nestedRequest = new Request(nestedUrl, { credentials: 'same-origin' })
    const nestedResponse = await fetch(nestedRequest, { cache: 'reload' })
    if (nestedResponse.ok) await cache.put(nestedRequest, nestedResponse.clone())
  }))
}

async function cacheStaticAssetsFromHtml(cache, html) {
  const assets = staticAssetUrlsFromHtml(html)
  await Promise.allSettled(assets.map((assetUrl) => cacheStaticAsset(cache, assetUrl)))
}

async function precacheOfflineNotesApp(cache) {
  try {
    const request = new Request(OFFLINE_NOTES_APP, { credentials: 'same-origin' })
    const response = await fetch(request, { cache: 'reload' })
    if (!response.ok) return

    const html = await response.clone().text()
    await cache.put(OFFLINE_NOTES_APP, response.clone())
    await cacheStaticAssetsFromHtml(cache, html)
  } catch {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(SHELL_ASSETS)
    await precacheOfflineNotesApp(cache)
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]))
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || typeof data.type !== 'string') return
  if (data.type === 'VIDA_NOTES_OWNER_SET' && OWNER_UUID_RE.test(data.userId || '')) {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(OFFLINE_NOTES_OWNER_MARKER, new Response(data.userId, { headers: { 'content-type': 'text/plain; charset=utf-8' } }))))
    return
  }
  if (data.type === 'VIDA_NOTES_OWNER_CLEAR') event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.delete(OFFLINE_NOTES_OWNER_MARKER)))
})

async function respuestaStaticNext(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return Response.error()
  }
}

async function respuestaOfflineNotesApp(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)
    if (response.ok) {
      const html = await response.clone().text()
      await cache.put(OFFLINE_NOTES_APP, response.clone())
      await cacheStaticAssetsFromHtml(cache, html)
    }
    return response
  } catch {
    const cached = await cache.match(OFFLINE_NOTES_APP)
    if (cached) return cached
    return new Response('Abre el Cuaderno una vez con conexión para habilitar el modo offline.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
}

async function respuestaNotasPrincipal(request) {
  try {
    return await fetch(request)
  } catch {
    const actual = new URL(request.url)
    const fallbackUrl = new URL(OFFLINE_NOTES_APP, self.location.origin)
    fallbackUrl.search = actual.search
    return Response.redirect(fallbackUrl.toString(), 302)
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  if (event.request.mode === 'navigate') {
    const pathname = url.pathname.replace(/\/+$/, '') || '/'
    if (url.origin === self.location.origin && pathname === '/biblia/notas') {
      event.respondWith(respuestaNotasPrincipal(event.request))
      return
    }
    if (url.origin === self.location.origin && pathname === OFFLINE_NOTES_APP) {
      event.respondWith(respuestaOfflineNotesApp(event.request))
      return
    }
    return
  }

  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) return

  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(respuestaStaticNext(event.request))
    return
  }

  if (url.pathname.startsWith('/_next/')) return

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try { payload = event.data.json() } catch {
    payload = { title: 'Vida Internacional', body: event.data.text(), url: '/inicio', tag: `vida-${Date.now()}`, renotify: true }
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
  event.waitUntil(Promise.all([
    self.registration.showNotification(payload.title || 'Vida Internacional', options),
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => client.postMessage({ type: 'VIDA_PUSH_RECEIVED', tag, url: options.data.url }))
    }),
  ]))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/inicio'
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
    for (const client of clientList) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        if ('navigate' in client) await client.navigate(targetUrl)
        return client.focus()
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl)
    return undefined
  }))
})
