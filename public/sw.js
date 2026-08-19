const CACHE_VERSION = 'v2.4-app-offline'
const CACHE_NAME = `vida-shell-${CACHE_VERSION}`
const USER_CACHE_PREFIX = `vida-user-${CACHE_VERSION}-`
const OFFLINE_NOTES_APP = '/biblia/notas-offline'
const OFFLINE_NOTES_OWNER_MARKER = '/offline/notas-owner'
const USER_WARM_MARKER = '/__vida_offline_warmed__'
const OWNER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CORE_OFFLINE_ROUTES = [
  '/inicio',
  '/calendario',
  '/avisos',
  '/estudios',
  '/perfil',
  '/ministerios',
]
const SHELL_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

function userCacheName(userId) {
  return `${USER_CACHE_PREFIX}${userId}`
}

function pageCacheKey(urlLike) {
  const source = typeof urlLike === 'string' ? urlLike : urlLike.url
  const url = new URL(source, self.location.origin)
  const key = new URL('/__vida_offline_page__', self.location.origin)
  key.searchParams.set('path', `${url.pathname}${url.search}`)
  return new Request(key.toString())
}

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

async function activeOwnerId() {
  const cache = await caches.open(CACHE_NAME)
  const response = await cache.match(OFFLINE_NOTES_OWNER_MARKER)
  if (!response) return null
  const value = (await response.text()).trim()
  return OWNER_UUID_RE.test(value) ? value : null
}

async function cacheUserPage(userId, urlLike, response) {
  if (!OWNER_UUID_RE.test(userId) || !response?.ok) return false
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return false

  let finalUrl
  try {
    finalUrl = new URL(response.url || (typeof urlLike === 'string' ? urlLike : urlLike.url), self.location.origin)
  } catch {
    return false
  }

  if (finalUrl.origin !== self.location.origin) return false
  if (
    finalUrl.pathname.startsWith('/login')
    || finalUrl.pathname.startsWith('/registro')
    || finalUrl.pathname.startsWith('/pendiente')
  ) return false

  const userCache = await caches.open(userCacheName(userId))
  await userCache.put(pageCacheKey(urlLike), response.clone())

  try {
    const html = await response.clone().text()
    const shellCache = await caches.open(CACHE_NAME)
    await cacheStaticAssetsFromHtml(shellCache, html)
  } catch {}

  return true
}

async function cacheRouteForUser(userId, path) {
  if (!OWNER_UUID_RE.test(userId) || typeof path !== 'string' || !path.startsWith('/')) return false
  if (path.startsWith('/api/') || path.startsWith('/login') || path.startsWith('/registro')) return false

  try {
    const url = new URL(path, self.location.origin)
    if (url.origin !== self.location.origin) return false
    const request = new Request(url.toString(), {
      method: 'GET',
      credentials: 'include',
      cache: 'reload',
      headers: { accept: 'text/html' },
    })
    const response = await fetch(request)
    return await cacheUserPage(userId, url.toString(), response)
  } catch {
    return false
  }
}

async function warmCoreRoutes(userId) {
  if (!OWNER_UUID_RE.test(userId)) return
  const userCache = await caches.open(userCacheName(userId))
  if (await userCache.match(USER_WARM_MARKER)) return

  let cachedCount = 0
  for (const route of CORE_OFFLINE_ROUTES) {
    if (await cacheRouteForUser(userId, route)) cachedCount += 1
  }

  if (cachedCount === CORE_OFFLINE_ROUTES.length) {
    await userCache.put(USER_WARM_MARKER, new Response(new Date().toISOString(), {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    }))
  }
}

async function setActiveOwner(userId) {
  if (!OWNER_UUID_RE.test(userId)) return
  const previous = await activeOwnerId()
  if (previous && previous !== userId) await caches.delete(userCacheName(previous))

  const cache = await caches.open(CACHE_NAME)
  await cache.put(OFFLINE_NOTES_OWNER_MARKER, new Response(userId, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  }))
  await warmCoreRoutes(userId)
}

async function clearActiveOwner(suggestedUserId) {
  const current = await activeOwnerId()
  const cache = await caches.open(CACHE_NAME)
  await cache.delete(OFFLINE_NOTES_OWNER_MARKER)

  const ids = new Set()
  if (current) ids.add(current)
  if (OWNER_UUID_RE.test(suggestedUserId || '')) ids.add(suggestedUserId)
  await Promise.all(Array.from(ids).map((id) => caches.delete(userCacheName(id))))
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function offlineFallbackResponse(pathname) {
  const path = escapeHtml(pathname || '/')
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="theme-color" content="#f4f5f9" />
<title>Sin conexión | Vida Internacional</title>
<style>
  :root{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;background:#f4f5f9;color:#171923}
  *{box-sizing:border-box}body{margin:0;background:#f4f5f9;min-height:100vh;padding:max(24px,env(safe-area-inset-top)) 18px max(28px,env(safe-area-inset-bottom))}
  main{max-width:560px;margin:0 auto;padding-top:32px}.icon{width:56px;height:56px;border-radius:18px;background:#fff;display:grid;place-items:center;font-size:27px;box-shadow:0 8px 28px rgba(15,23,42,.08)}
  h1{font-size:28px;letter-spacing:-.03em;margin:20px 0 8px}.muted{color:#64748b;line-height:1.55;font-size:15px}.card{margin-top:22px;background:#fff;border:1px solid #eef0f4;border-radius:22px;padding:18px;box-shadow:0 4px 18px rgba(15,23,42,.05)}
  .label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#6366f1}.path{margin-top:7px;font-size:13px;color:#475569;overflow-wrap:anywhere}
  .links{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.links a{min-height:48px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;color:#1e293b;text-decoration:none;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
  .links a.primary{background:#4f46e5;color:#fff;border-color:#4f46e5}.tip{margin-top:18px;font-size:12px;color:#94a3b8;line-height:1.5}
</style>
</head>
<body>
<main>
  <div class="icon" aria-hidden="true">↻</div>
  <h1>Estás sin conexión</h1>
  <p class="muted">VIDA seguirá abriendo las secciones que este dispositivo ya guardó. Las funciones que necesitan servidor se reactivarán automáticamente al volver Internet.</p>
  <section class="card">
    <div class="label">Pantalla solicitada</div>
    <div class="path">${path}</div>
    <div class="links">
      <a class="primary" href="/inicio">Inicio</a>
      <a href="/calendario">Calendario</a>
      <a href="/avisos">Avisos</a>
      <a href="/estudios">Estudios</a>
      <a href="/ministerios">Ministerios</a>
      <a href="/biblia/notas">Cuaderno</a>
    </div>
    <p class="tip">Si una sección todavía no fue guardada, ábrela una vez con conexión. El Cuaderno conserva sus notas localmente y sincroniza al reconectar.</p>
  </section>
</main>
<script>addEventListener('online',()=>location.reload())</script>
</body>
</html>`
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-vida-offline': 'fallback',
    },
  })
}

async function fetchWithTimeout(request, timeoutMs = 4500) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(request, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
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
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => key !== CACHE_NAME && !key.startsWith(USER_CACHE_PREFIX))
      .map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]))
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || typeof data.type !== 'string') return

  if (data.type === 'VIDA_NOTES_OWNER_SET' && OWNER_UUID_RE.test(data.userId || '')) {
    event.waitUntil(setActiveOwner(data.userId))
    return
  }

  if (data.type === 'VIDA_NOTES_OWNER_CLEAR') {
    event.waitUntil(clearActiveOwner(data.userId))
    return
  }

  if (data.type === 'VIDA_OFFLINE_CACHE_ROUTE' && typeof data.path === 'string') {
    event.waitUntil((async () => {
      const userId = await activeOwnerId()
      if (userId) await cacheRouteForUser(userId, data.path)
    })())
  }
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
    return await fetchWithTimeout(request)
  } catch {
    const actual = new URL(request.url)
    const fallbackUrl = new URL(OFFLINE_NOTES_APP, self.location.origin)
    fallbackUrl.search = actual.search
    return Response.redirect(fallbackUrl.toString(), 302)
  }
}

async function respuestaNavegacionApp(request) {
  const url = new URL(request.url)
  const userId = await activeOwnerId()

  try {
    const response = await fetchWithTimeout(request)
    if (userId && response.ok) {
      await cacheUserPage(userId, url.toString(), response.clone())
    }
    return response
  } catch {
    if (userId) {
      const userCache = await caches.open(userCacheName(userId))
      const cached = await userCache.match(pageCacheKey(url.toString()), { ignoreVary: true })
      if (cached) return cached
    }
    return offlineFallbackResponse(url.pathname)
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
    if (url.origin === self.location.origin) {
      event.respondWith(respuestaNavegacionApp(event.request))
    }
    return
  }

  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) return

  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(respuestaStaticNext(event.request))
    return
  }

  if (url.pathname.startsWith('/_next/')) return

  event.respondWith(caches.match(event.request).then(async (cached) => {
    if (cached) return cached
    try {
      return await fetch(event.request)
    } catch {
      return Response.error()
    }
  }))
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
