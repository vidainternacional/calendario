'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Camera, Check, Loader2, QrCode, ScanLine, Trash2, UserRoundPlus, Users, X } from 'lucide-react'
import { eliminarContacto, enviarSolicitudPorCodigo, enviarSolicitudPorQr, responderSolicitudContacto } from '@/app/actions/contactos'

type Persona = { id: string; nombre_completo: string; email: string | null }
type Relacion = {
  id: string
  estado: string
  solicitante_id: string
  destinatario_id: string
  created_at: string
  solicitante: Persona | null
  destinatario: Persona | null
}

export default function ContactosClient({ miId, miNombre, qrToken, relaciones }: {
  miId: string
  miNombre: string
  qrToken: string
  relaciones: Relacion[]
}) {
  const [tab, setTab] = useState<'contactos' | 'qr' | 'escanear'>('contactos')
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null)
  const [pending, startTransition] = useTransition()
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')

  const aceptados = relaciones.filter((relacion) => relacion.estado === 'aceptado')
  const recibidas = relaciones.filter((relacion) => relacion.estado === 'pendiente' && relacion.destinatario_id === miId)
  const enviadas = relaciones.filter((relacion) => relacion.estado === 'pendiente' && relacion.solicitante_id === miId)
  const otro = (relacion: Relacion): Persona | null => relacion.solicitante_id === miId ? relacion.destinatario : relacion.solicitante

  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const stopRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (tab !== 'qr' || !qrCanvasRef.current || !qrToken) return
    import('qrcode')
      .then((QR) => QR.toCanvas(qrCanvasRef.current, `vida:${qrToken}`, {
        width: 280,
        margin: 2,
        color: { dark: '#171923', light: '#ffffff' },
      }))
      .catch(() => {})
  }, [tab, qrToken])

  useEffect(() => () => stopRef.current(), [])
  useEffect(() => {
    if (tab !== 'escanear') {
      stopRef.current()
      setScanning(false)
    }
  }, [tab])

  const flash = (texto: string, ok: boolean) => {
    setMsg({ texto, ok })
    setTimeout(() => setMsg(null), 4500)
  }

  const responder = (id: string, aceptar: boolean) => {
    startTransition(async () => {
      const respuesta = await responderSolicitudContacto(id, aceptar)
      flash(respuesta.error ?? (aceptar ? '✓ ¡Ahora son contactos!' : 'Solicitud rechazada'), !respuesta.error)
    })
  }

  const borrar = (id: string) => {
    if (!confirm('¿Eliminar este contacto?')) return
    startTransition(async () => {
      await eliminarContacto(id)
      flash('Contacto eliminado', true)
    })
  }

  const procesarToken = (raw: string) => {
    stopRef.current()
    setScanning(false)
    startTransition(async () => {
      const respuesta = await enviarSolicitudPorQr(raw)
      flash(respuesta.error ?? `📤 Solicitud enviada a ${respuesta.nombre}. Espera su confirmación.`, !respuesta.error)
    })
  }

  const iniciarEscaner = async () => {
    setScanError(null)
    try {
      const jsQR = (await import('jsqr')).default
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      setScanning(true)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      let activo = true
      stopRef.current = () => {
        activo = false
        stream.getTracks().forEach((track) => track.stop())
      }

      const loop = () => {
        if (!activo) return
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(image.data, image.width, image.height)
          if (code?.data) {
            procesarToken(code.data)
            return
          }
        }
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    } catch {
      setScanError('No se pudo abrir la cámara. Revisa los permisos del navegador.')
    }
  }

  const Tarjeta = ({ persona, extra }: { persona: Persona | null; extra?: React.ReactNode }) => (
    <article className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
          {(persona?.nombre_completo ?? '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold leading-snug text-[#171923]">{persona?.nombre_completo ?? 'Usuario'}</p>
          {persona?.email && <p className="mt-0.5 break-all text-xs text-slate-500">{persona.email}</p>}
        </div>
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </article>
  )

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <header className="mb-6">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Comunidad</p>
        <h1 className="text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">Mis contactos</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">Conéctate con otros servidores usando su código QR.</p>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/60 p-1" role="tablist" aria-label="Opciones de contactos">
        {([
          ['contactos', 'Contactos', Users],
          ['qr', 'Mi QR', QrCode],
          ['escanear', 'Escanear', ScanLine],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 text-xs font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:text-sm ${tab === key ? 'bg-white text-[#171923] shadow-sm' : 'text-slate-600 hover:text-[#171923]'}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${msg.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`} role="status">
          {msg.texto}
        </div>
      )}

      {tab === 'contactos' && (
        <div className="space-y-6">
          {recibidas.length > 0 && (
            <section className="space-y-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-amber-800">Solicitudes recibidas</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-amber-700">{recibidas.length}</span>
              </div>
              {recibidas.map((relacion) => (
                <Tarjeta
                  key={relacion.id}
                  persona={otro(relacion)}
                  extra={
                    <div className="flex gap-2">
                      <button type="button" disabled={pending} onClick={() => responder(relacion.id, true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50" aria-label="Aceptar solicitud">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button type="button" disabled={pending} onClick={() => responder(relacion.id, false)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-500 disabled:opacity-50" aria-label="Rechazar solicitud">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  }
                />
              ))}
            </section>
          )}

          {enviadas.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Esperando respuesta</h2>
              {enviadas.map((relacion) => (
                <Tarjeta key={relacion.id} persona={otro(relacion)} extra={<span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">Pendiente</span>} />
              ))}
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Contactos</h2>
              <span className="text-xs font-semibold text-slate-400">{aceptados.length}</span>
            </div>
            {aceptados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
                <UserRoundPlus className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">Aún no tienes contactos</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-400">Abre la pestaña Escanear y apunta al QR de un compañero para enviarle una solicitud.</p>
              </div>
            ) : (
              aceptados.map((relacion) => (
                <Tarjeta
                  key={relacion.id}
                  persona={otro(relacion)}
                  extra={
                    <button type="button" onClick={() => borrar(relacion.id)} disabled={pending} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50" aria-label="Eliminar contacto">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                />
              ))
            )}
          </section>
        </div>
      )}

      {tab === 'qr' && (
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 text-center shadow-sm sm:p-8">
          <p className="mb-5 text-sm leading-relaxed text-slate-500">Muestra este código para que otra persona pueda agregarte.</p>
          <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-100 bg-white p-2">
            <canvas ref={qrCanvasRef} width={280} height={280} className="h-auto w-full" />
          </div>
          <p className="mt-5 break-words font-bold text-[#171923]">{miNombre || 'Mi perfil'}</p>
          <p className="mt-1 text-xs text-slate-400">Vida Internacional</p>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-1 text-[11px] leading-relaxed text-slate-500">¿La cámara no funciona? Comparte este código:</p>
            <p className="break-all font-mono text-lg font-bold tracking-[0.16em] text-[#171923]">{qrToken.slice(0, 8)}</p>
          </div>
        </section>
      )}

      {tab === 'escanear' && (
        <section className="rounded-[24px] border border-slate-100 bg-white p-4 text-center shadow-sm sm:p-6">
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-white/80">
                <Camera className="h-10 w-10" />
                <button type="button" onClick={iniciarEscaner} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white">Abrir cámara</button>
              </div>
            )}
            {scanning && <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/60 animate-pulse" />}
          </div>

          {scanError && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-600">{scanError}</p>}
          <p className="mt-4 text-xs leading-relaxed text-slate-400">Apunta al QR de tu compañero. La solicitud se enviará automáticamente cuando sea detectado.</p>

          <div className="mt-5 border-t border-slate-100 pt-5 text-left">
            <label htmlFor="codigo-contacto" className="mb-2 block text-xs font-semibold text-slate-600">¿No funciona la cámara? Ingresa su código:</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id="codigo-contacto"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                maxLength={8}
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Ej: a3f9c21b"
                className="h-12 min-w-0 rounded-xl border border-slate-300 bg-white px-3 font-mono text-base tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ colorScheme: 'light' }}
              />
              <button
                type="button"
                disabled={pending || codigo.trim().length < 8}
                onClick={() => {
                  startTransition(async () => {
                    const respuesta = await enviarSolicitudPorCodigo(codigo)
                    flash(respuesta.error ?? `📤 Solicitud enviada a ${respuesta.nombre}.`, !respuesta.error)
                    if (!respuesta.error) setCodigo('')
                  })
                }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Conectar
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
