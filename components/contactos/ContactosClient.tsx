'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { QrCode, ScanLine, Users, Check, X, Trash2, Camera } from 'lucide-react'
import { enviarSolicitudPorQr, enviarSolicitudPorCodigo, responderSolicitudContacto, eliminarContacto } from '@/app/actions/contactos'

type Persona = { id: string; nombre_completo: string; email: string | null }
type Relacion = {
  id: string; estado: string; solicitante_id: string; destinatario_id: string; created_at: string
  solicitante: Persona | null; destinatario: Persona | null
}

export default function ContactosClient({ miId, miNombre, qrToken, relaciones }: {
  miId: string; miNombre: string; qrToken: string; relaciones: Relacion[]
}) {
  const [tab, setTab] = useState<'contactos' | 'qr' | 'escanear'>('contactos')
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  const aceptados = relaciones.filter(r => r.estado === 'aceptado')
  const recibidas = relaciones.filter(r => r.estado === 'pendiente' && r.destinatario_id === miId)
  const enviadas = relaciones.filter(r => r.estado === 'pendiente' && r.solicitante_id === miId)

  const otro = (r: Relacion): Persona | null => (r.solicitante_id === miId ? r.destinatario : r.solicitante)

  // QR dibujado por la propia app (sin servicios externos)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (tab !== 'qr' || !qrCanvasRef.current || !qrToken) return
    import('qrcode').then(QR => {
      QR.toCanvas(qrCanvasRef.current, `vida:${qrToken}`, { width: 280, margin: 2, color: { dark: '#171923', light: '#ffffff' } })
    }).catch(() => {})
  }, [tab, qrToken])

  const flash = (texto: string, ok: boolean) => { setMsg({ texto, ok }); setTimeout(() => setMsg(null), 4500) }

  const responder = (id: string, aceptar: boolean) =>
    startTransition(async () => {
      const r = await responderSolicitudContacto(id, aceptar)
      flash(r.error ?? (aceptar ? '✓ ¡Ahora son contactos!' : 'Solicitud rechazada'), !r.error)
    })

  const borrar = (id: string) => {
    if (!confirm('¿Eliminar este contacto?')) return
    startTransition(async () => { await eliminarContacto(id); flash('Contacto eliminado', true) })
  }

  // ── Escáner ──
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const stopRef = useRef<() => void>(() => {})

  useEffect(() => () => stopRef.current(), [])
  useEffect(() => { if (tab !== 'escanear') { stopRef.current(); setScanning(false) } }, [tab])

  const procesarToken = (raw: string) => {
    stopRef.current(); setScanning(false)
    startTransition(async () => {
      const r = await enviarSolicitudPorQr(raw)
      flash(r.error ?? `📤 Solicitud enviada a ${r.nombre}. Espera su confirmación.`, !r.error)
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
      stopRef.current = () => { activo = false; stream.getTracks().forEach(t => t.stop()) }

      const loop = () => {
        if (!activo) return
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth; canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(img.data, img.width, img.height)
          if (code?.data) { procesarToken(code.data); return }
        }
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    } catch {
      setScanError('No se pudo abrir la cámara. Revisa los permisos del navegador.')
    }
  }

  const Tarjeta = ({ p, extra }: { p: Persona | null; extra?: React.ReactNode }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">
          {(p?.nombre_completo ?? '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[#171923] truncate">{p?.nombre_completo ?? 'Usuario'}</p>
          {p?.email && <p className="text-xs text-slate-400 truncate">{p.email}</p>}
        </div>
      </div>
      {extra}
    </div>
  )

  return (
    <main className="px-4 py-8 max-w-2xl mx-auto pb-28">
      <h1 className="text-2xl font-bold text-[#171923] mb-1">Mis Contactos</h1>
      <p className="text-sm text-slate-500 mb-6">Conéctate con otros servidores escaneando su QR</p>

      <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6">
        {([['contactos', 'Contactos', Users], ['qr', 'Mi QR', QrCode], ['escanear', 'Escanear', ScanLine]] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${tab === k ? 'bg-white text-[#171923] shadow-sm' : 'text-gray-500'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {msg.texto}
        </div>
      )}

      {tab === 'contactos' && (
        <div className="space-y-6">
          {recibidas.length > 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-amber-800">Solicitudes recibidas</h2>
              {recibidas.map(r => (
                <Tarjeta key={r.id} p={otro(r)} extra={
                  <div className="flex gap-2 shrink-0">
                    <button disabled={pending} onClick={() => responder(r.id, true)} className="p-2.5 bg-emerald-600 text-white rounded-xl"><Check className="w-4 h-4" /></button>
                    <button disabled={pending} onClick={() => responder(r.id, false)} className="p-2.5 bg-white border border-rose-200 text-rose-500 rounded-xl"><X className="w-4 h-4" /></button>
                  </div>
                } />
              ))}
            </section>
          )}

          {enviadas.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Esperando respuesta</h2>
              {enviadas.map(r => <Tarjeta key={r.id} p={otro(r)} extra={<span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-md shrink-0">Pendiente</span>} />)}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Contactos ({aceptados.length})</h2>
            {aceptados.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">
                Aún no tienes contactos.<br />Toca <b>Escanear</b> y apunta al QR de un compañero. 📲
              </div>
            )}
            {aceptados.map(r => (
              <Tarjeta key={r.id} p={otro(r)} extra={
                <button onClick={() => borrar(r.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
              } />
            ))}
          </section>
        </div>
      )}

      {tab === 'qr' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
          <p className="text-sm text-slate-500 mb-5">Muestra este código para que otros te agreguen</p>
          <canvas ref={qrCanvasRef} width={280} height={280} className="mx-auto rounded-2xl border border-slate-100" />
          <p className="mt-5 font-bold text-[#171923]">{miNombre}</p>
          <p className="text-xs text-slate-400 mt-1">Vida Internacional</p>
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-[11px] text-slate-400 mb-1">¿La cámara del otro no funciona? Dale tu código:</p>
            <p className="text-lg font-mono font-bold tracking-[0.2em] text-[#171923]">{qrToken.slice(0, 8)}</p>
          </div>
        </div>
      )}

      {tab === 'escanear' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-sm mx-auto">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/80">
                <Camera className="w-10 h-10" />
                <button onClick={iniciarEscaner} className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
                  Abrir cámara
                </button>
              </div>
            )}
            {scanning && <div className="absolute inset-6 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none animate-pulse" />}
          </div>
          {scanError && <p className="mt-4 text-sm text-rose-600">{scanError}</p>}
          <p className="mt-4 text-xs text-slate-400">Apunta al QR de tu compañero. La solicitud se envía sola al detectarlo.</p>
          <div className="mt-5 border-t border-slate-100 pt-5 text-left">
            <p className="text-xs font-semibold text-slate-500 mb-2">¿No funciona la cámara? Ingresa su código:</p>
            <div className="flex gap-2">
              <input value={codigo} onChange={e => setCodigo(e.target.value)} maxLength={8} placeholder="Ej: a3f9c21b"
                className="flex-1 text-sm font-mono tracking-widest px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none" style={{ colorScheme: 'light' }} />
              <button disabled={pending || codigo.trim().length < 8} onClick={() => {
                startTransition(async () => {
                  const r = await enviarSolicitudPorCodigo(codigo)
                  flash(r.error ?? `📤 Solicitud enviada a ${r.nombre}.`, !r.error)
                  if (!r.error) setCodigo('')
                })
              }} className="px-4 text-sm font-semibold bg-indigo-600 text-white rounded-xl disabled:opacity-40">Conectar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
