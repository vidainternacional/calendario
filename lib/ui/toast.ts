'use client'

type ToastTipo = 'ok' | 'error'

const TOAST_ID = 'vida-app-toast'

/** Notificación accesible dentro de la app para resultados de acciones. */
export function mostrarToast(mensaje?: string | null, tipo: ToastTipo = 'ok') {
  if (typeof document === 'undefined' || !mensaje) return

  document.getElementById(TOAST_ID)?.remove()

  const toast = document.createElement('div')
  toast.id = TOAST_ID
  toast.setAttribute('role', tipo === 'error' ? 'alert' : 'status')
  toast.setAttribute('aria-live', tipo === 'error' ? 'assertive' : 'polite')
  toast.setAttribute('aria-atomic', 'true')

  const icono = document.createElement('span')
  icono.textContent = tipo === 'ok' ? '✓' : '!'
  icono.setAttribute('aria-hidden', 'true')
  icono.setAttribute('style', [
    'display:grid', 'place-items:center', 'width:24px', 'height:24px',
    'flex:0 0 24px', 'border-radius:999px', 'font-size:14px',
    'font-weight:800', 'background:rgba(255,255,255,.2)',
  ].join(';'))

  const texto = document.createElement('span')
  texto.textContent = mensaje
  texto.setAttribute('style', 'min-width:0;overflow-wrap:anywhere')

  toast.append(icono, texto)

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  toast.setAttribute('style', [
    'position:fixed', 'left:50%',
    'bottom:calc(5.75rem + env(safe-area-inset-bottom, 0px))',
    'transform:translate(-50%,12px)', 'z-index:9999',
    'display:flex', 'align-items:center', 'gap:10px',
    'width:max-content', 'max-width:min(90vw,420px)',
    'padding:12px 16px', 'border-radius:16px',
    'font-size:14px', 'line-height:1.4', 'font-weight:650',
    'color:#fff', 'text-align:left',
    'box-shadow:0 12px 34px rgba(15,23,42,.28)',
    'border:1px solid rgba(255,255,255,.18)',
    'backdrop-filter:blur(12px)', '-webkit-backdrop-filter:blur(12px)',
    'opacity:0',
    reduceMotion ? 'transition:none' : 'transition:opacity .2s ease,transform .2s ease',
    `background:${tipo === 'ok' ? 'rgba(5,150,105,.96)' : 'rgba(225,29,72,.96)'}`,
  ].join(';'))

  document.body.appendChild(toast)

  requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translate(-50%,0)'
  })

  window.setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = reduceMotion ? 'translate(-50%,0)' : 'translate(-50%,8px)'
    window.setTimeout(() => toast.remove(), reduceMotion ? 0 : 220)
  }, tipo === 'error' ? 4200 : 3200)
}
