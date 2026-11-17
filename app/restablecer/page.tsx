'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthFrame from '@/components/auth/AuthFrame'

export default function RestablecerPage() {
  const [msg, setMsg] = useState<string | null>(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirm, setMostrarConfirm] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [acceso, setAcceso] = useState<'verificando' | 'listo' | 'invalido'>('verificando')

  useEffect(() => {
    let activo = true

    async function comprobarEnlace() {
      // Leer antes de inicializar el SDK: el cliente podría procesar
      // el fragmento de Supabase por su cuenta y limpiar la URL.
      const fragmento = new URLSearchParams(window.location.hash.slice(1))
      const consulta = new URLSearchParams(window.location.search)
      const accessToken = fragmento.get('access_token')
      const refreshToken = fragmento.get('refresh_token')
      const tipo = fragmento.get('type')
      const codigo = consulta.get('code')
      const errorLink = fragmento.get('error') || consulta.get('error')
      if (window.location.hash || codigo || errorLink) {
        // Evita dejar credenciales de recuperación en el historial del teléfono.
        window.history.replaceState(null, '', '/restablecer')
      }

      const supabase = createClient()
      if (errorLink) throw new Error('El enlace de recuperación no es válido o ha expirado.')
      if (accessToken || refreshToken) {
        if (!accessToken || !refreshToken || tipo !== 'recovery') {
          throw new Error('El enlace no contiene una sesión de recuperación válida.')
        }
        const { error } = await supabase.auth.setSession({
          access_token: accessToken, refresh_token: refreshToken,
        })
        if (error) throw error
      } else if (codigo) {
        // Compatible con enlaces PKCE preexistentes si contienen su verificador.
        const { error } = await supabase.auth.exchangeCodeForSession(codigo)
        if (error) throw error
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error('Necesitás solicitar un enlace nuevo para crear tu contraseña.')
      if (activo) setAcceso('listo')
    }

    void comprobarEnlace().catch(() => {
      if (activo) {
        setAcceso('invalido')
        setMsg('El enlace es inválido o ha expirado. Solicitá uno nuevo.')
      }
    })
    return () => { activo = false }
  }, [])

  if (acceso !== 'listo') return (
    <AuthFrame
      title={acceso === 'verificando' ? 'Verificando tu enlace' : 'Solicitá un enlace nuevo'}
      subtitle={acceso === 'verificando'
        ? 'Estamos comprobando el enlace de recuperación de forma segura.'
        : 'El enlace no es válido o ya expiró. Podés pedir otro sin perder tu cuenta.'}
      backHref="/login"
      backLabel="Iniciar sesión"
    >
      {acceso === 'verificando'
        ? <div className="flex items-center gap-3 py-4 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Verificando…</div>
        : <Link href="/olvide" className="flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-bold text-white">Solicitar otro enlace</Link>}
    </AuthFrame>
  )

  const enviar = (fd: FormData) =>
    startTransition(async () => {
      const pass = fd.get('password') as string
      const conf = fd.get('confirm') as string
      if (pass.length < 8) return setMsg('La contraseña debe tener al menos 8 caracteres.')
      if (pass !== conf) return setMsg('Las contraseñas no coinciden.')
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: pass })
      if (error) return setMsg('No se pudo actualizar. El enlace pudo haber expirado — solicita uno nuevo.')
      setMsg('✓ Contraseña actualizada. Entrando…')
      setTimeout(() => router.push('/inicio'), 1200)
    })

  return (
    <AuthFrame
      title="Crea una nueva contraseña"
      subtitle="Elige una contraseña segura para volver a entrar a Vida Internacional."
      backHref="/login"
      backLabel="Iniciar sesión"
    >
      <form action={enviar} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-bold text-slate-700">Nueva contraseña</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={mostrarPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              style={{ colorScheme: 'light' }}
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={mostrarPassword}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
            >
              {mostrarPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="block text-sm font-bold text-slate-700">Confirmar contraseña</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="confirm"
              name="confirm"
              type={mostrarConfirm ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-[15px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              style={{ colorScheme: 'light' }}
            />
            <button
              type="button"
              onClick={() => setMostrarConfirm(!mostrarConfirm)}
              aria-label={mostrarConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={mostrarConfirm}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
            >
              {mostrarConfirm ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {msg && (
          <p className={`rounded-2xl border px-4 py-3 text-sm font-medium ${msg.startsWith('✓') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {msg}
          </p>
        )}

        <button
          disabled={pending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-[15px] font-black text-white shadow-lg shadow-violet-600/20 transition active:scale-[0.985] disabled:opacity-50"
        >
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando…</> : 'Guardar y entrar'}
        </button>
      </form>
    </AuthFrame>
  )
}
