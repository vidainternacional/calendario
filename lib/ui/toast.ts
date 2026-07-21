'use client'

/** Notificación bonita dentro de la app (reemplaza los alert() del navegador). */
export function mostrarToast(mensaje?: string | null, tipo: 'ok' | 'error' = 'ok') {
  if (typeof document === 'undefined' || !mensaje) return
  const t = document.createElement('div')
  t.textContent = mensaje
  t.setAttribute('style', [
    'position:fixed', 'left:50%', 'bottom:88px', 'transform:translateX(-50%)',
    'z-index:9999', 'max-width:90vw', 'padding:12px 20px', 'border-radius:14px',
    'font-size:14px', 'font-weight:600', 'color:#fff', 'text-align:center',
    'box-shadow:0 8px 30px rgba(0,0,0,.25)', 'opacity:0', 'transition:opacity .25s',
    `background:${tipo === 'ok' ? '#059669' : '#e11d48'}`,
  ].join(';'))
  document.body.appendChild(t)
  requestAnimationFrame(() => { t.style.opacity = '1' })
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300) }, 3200)
}
