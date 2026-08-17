const CACHE_NAME = 'vida-shell-v2.2-cuaderno-profesional'
const OFFLINE_NOTES_SHELL = '/offline/notas.html'
const OFFLINE_NOTES_OWNER_MARKER = '/offline/notas-owner'
const OWNER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SHELL_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  OFFLINE_NOTES_SHELL,
]

const OFFLINE_NOTES_PARITY_STYLE = `<style id="vida-offline-notebook-parity">
  .panel{overflow:visible!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
  .top{padding:0!important;border-bottom:0!important;background:transparent!important}
  .search{min-height:48px!important;border:1px solid color-mix(in srgb,var(--border) 70%,transparent)!important;border-radius:20px!important;background:color-mix(in srgb,var(--field) 72%,transparent)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}
  .cards{min-height:84px!important;gap:12px!important;padding:12px 0 4px!important}
  .card{width:80px!important;height:80px!important;flex:0 0 80px!important;border-radius:999px!important;padding:8px!important;align-items:center!important;justify-content:center!important;text-align:center!important;background:transparent!important;box-shadow:none!important}
  .card.selected{border-color:rgb(139 92 246 / .7)!important;background:rgb(139 92 246 / .10)!important;box-shadow:0 0 0 1px rgb(139 92 246 / .08)!important}
  .card-title{-webkit-line-clamp:3!important;font-size:10px!important;line-height:13px!important;text-align:center!important}
  .card-meta{display:none!important}
  .editor{min-height:calc(100vh - 280px)!important;margin-top:10px!important;padding:0 0 calc(7rem + env(safe-area-inset-bottom,0px))!important;background:transparent!important}
  .title{font-size:28px!important;letter-spacing:-.025em!important}
  .origin-banner{border:0!important;background:transparent!important;padding-inline:2px!important}
  .save-state{border:0!important;background:transparent!important;padding-inline:2px!important}
  textarea{min-height:58vh!important;overflow:hidden!important;padding-bottom:6rem!important}
  .new{width:48px!important;height:48px!important;min-height:48px!important;padding:0!important;border-radius:999px!important;font-size:0!important;display:grid!important;place-items:center!important}
  .new::before{content:'+';font-size:26px!important;line-height:1!important}
</style>`

const OFFLINE_NOTES_PARITY_SCRIPT = `<script>
document.addEventListener('DOMContentLoaded',()=>{
  const legacyOrigin=document.querySelector('[data-origin="biblia_notas"]');
  if(legacyOrigin) legacyOrigin.textContent='Biblia / Cuaderno';
  const content=document.getElementById('content');
  const type=document.getElementById('type');
  const reference=document.getElementById('reference');
  const banner=document.getElementById('origin-banner');
  const bannerLabel=banner?.querySelector('span:first-child');
  const bannerRef=document.getElementById('origin-reference');
  const autoGrow=()=>{if(!content)return;content.style.height='auto';content.style.height=Math.max(content.scrollHeight,window.innerHeight*.58)+'px'};
  const syncBibleOrigin=()=>{
    if(!banner||!bannerLabel||!type||!reference)return;
    const bible=type.value==='versiculo'&&Boolean(reference.value.trim());
    if(bible&&banner.hidden){banner.dataset.vidaOfflineBible='true';banner.hidden=false;bannerLabel.textContent='Origen: Biblia';if(bannerRef)bannerRef.textContent=reference.value.trim()}
    else if(banner.dataset.vidaOfflineBible==='true'&&!bible){banner.hidden=true;delete banner.dataset.vidaOfflineBible;bannerLabel.textContent='Origen: Estudio Profundo';if(bannerRef)bannerRef.textContent=''}
    else if(banner.dataset.vidaOfflineBible==='true'&&bible&&bannerRef){bannerRef.textContent=reference.value.trim()}
  };
  content?.addEventListener('input',autoGrow);
  reference?.addEventListener('input',syncBibleOrigin);
  type?.addEventListener('change',syncBibleOrigin);
  document.addEventListener('click',()=>setTimeout(()=>{autoGrow();syncBibleOrigin()},0));
  window.addEventListener('resize',autoGrow,{passive:true});
  setTimeout(()=>{autoGrow();syncBibleOrigin()},0);
});
</script>`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)))
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

async function respuestaNotasOffline() {
  const cache = await caches.open(CACHE_NAME)
  const shell = await cache.match(OFFLINE_NOTES_SHELL)
  if (!shell) return Response.error()

  const html = await shell.text()
  const ownerResponse = await cache.match(OFFLINE_NOTES_OWNER_MARKER)
  const ownerId = ownerResponse ? (await ownerResponse.text()).trim() : ''
  const ownerBootstrap = OWNER_UUID_RE.test(ownerId)
    ? `<script>try{localStorage.setItem('vida-biblia-notas-active-owner-v1',${JSON.stringify(ownerId)})}catch{}</script>`
    : ''
  const enhancedHtml = html
    .replace('<head>', `<head>${ownerBootstrap}`)
    .replace('</head>', `${OFFLINE_NOTES_PARITY_STYLE}${OFFLINE_NOTES_PARITY_SCRIPT}</head>`)

  const headers = new Headers(shell.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')
  headers.set('content-type', 'text/html; charset=utf-8')
  return new Response(enhancedHtml, { status: shell.status, statusText: shell.statusText, headers })
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (event.request.mode === 'navigate') {
    const pathname = url.pathname.replace(/\/+$/, '') || '/'
    if (url.origin === self.location.origin && pathname === '/biblia/notas') {
      event.respondWith(fetch(event.request).catch(() => respuestaNotasOffline()))
    }
    return
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/') || url.hostname.includes('supabase.co')) return
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
