'use client'

import { useMemo, useState, useTransition } from 'react'
import { BookOpenCheck, CheckCircle2, Loader2, Search, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { establecerAccesoCentroPastoral } from '@/app/actions/admin-acceso-pastoral'
import { accesoPastoralIncluidoPorRol } from '@/lib/pastoral/access'
import { mostrarToast } from '@/lib/ui/toast'

type UsuarioAcceso = {
  id: string
  nombre_completo: string | null
  email: string | null
  rol: string
  estado_cuenta: string | null
  acceso_centro_pastoral: boolean
}

const ETIQUETAS_ROL: Record<string, string> = {
  servidor: 'Servidor',
  lider: 'Líder',
  pastor: 'Pastor',
  administrador: 'Administrador',
}

export default function AccesosPastoralesClient({ usuarios }: { usuarios: UsuarioAcceso[] }) {
  const [lista, setLista] = useState(usuarios)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'con-acceso' | 'sin-acceso'>('todos')
  const [procesando, setProcesando] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return lista.filter((usuario) => {
      const incluidoPorRol = accesoPastoralIncluidoPorRol(usuario.rol)
      const tieneAcceso = incluidoPorRol || usuario.acceso_centro_pastoral
      if (filtro === 'con-acceso' && !tieneAcceso) return false
      if (filtro === 'sin-acceso' && tieneAcceso) return false
      if (!termino) return true
      return (usuario.nombre_completo ?? '').toLowerCase().includes(termino)
        || (usuario.email ?? '').toLowerCase().includes(termino)
    })
  }, [busqueda, filtro, lista])

  const accesosExplícitos = lista.filter((usuario) => !accesoPastoralIncluidoPorRol(usuario.rol) && usuario.acceso_centro_pastoral).length

  const cambiarAcceso = (usuario: UsuarioAcceso) => {
    if (accesoPastoralIncluidoPorRol(usuario.rol)) return
    const siguiente = !usuario.acceso_centro_pastoral
    setProcesando(usuario.id)

    startTransition(async () => {
      const resultado = await establecerAccesoCentroPastoral(usuario.id, siguiente)
      if (!resultado.success) {
        mostrarToast(resultado.error)
        setProcesando(null)
        return
      }

      setLista((actual) => actual.map((item) => item.id === usuario.id
        ? { ...item, acceso_centro_pastoral: siguiente }
        : item))
      mostrarToast(siguiente ? 'Acceso pastoral concedido' : 'Acceso pastoral retirado')
      setProcesando(null)
    })
  }

  return (
    <>
      <section className="grid grid-cols-2 gap-3" aria-label="Resumen de accesos pastorales">
        <article className="rounded-[20px] border border-indigo-100 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><ShieldCheck className="h-5 w-5" /></span>
          <p className="mt-3 text-2xl font-bold text-slate-950">{accesosExplícitos}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Accesos asignados</p>
        </article>
        <article className="rounded-[20px] border border-emerald-100 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><UserRoundCheck className="h-5 w-5" /></span>
          <p className="mt-3 text-2xl font-bold text-slate-950">{lista.length}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cuentas registradas</p>
        </article>
      </section>

      <section className="mt-5 rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Filtrar accesos">
          {([
            ['todos', 'Todos'],
            ['con-acceso', 'Con acceso'],
            ['sin-acceso', 'Sin acceso'],
          ] as const).map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              className={`min-h-10 rounded-xl px-2 text-[11px] font-bold ${filtro === valor ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 space-y-3" aria-label="Usuarios y acceso al Centro Pastoral">
        {filtrados.map((usuario) => {
          const incluidoPorRol = accesoPastoralIncluidoPorRol(usuario.rol)
          const cuentaActiva = (usuario.estado_cuenta ?? 'pendiente') === 'activo'
          const accesoEfectivo = cuentaActiva && (incluidoPorRol || usuario.acceso_centro_pastoral)
          const estaProcesando = procesando === usuario.id && isPending

          return (
            <article key={usuario.id} className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accesoEfectivo ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                  {accesoEfectivo ? <BookOpenCheck className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-sm font-bold text-slate-950">{usuario.nombre_completo || 'Usuario sin nombre'}</h2>
                  {usuario.email && <p className="mt-0.5 break-all text-xs text-slate-500">{usuario.email}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">{ETIQUETAS_ROL[usuario.rol] ?? usuario.rol}</span>
                    {!cuentaActiva && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase text-rose-700">{usuario.estado_cuenta ?? 'Pendiente'}</span>}
                    {accesoEfectivo && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Acceso activo</span>}
                  </div>
                </div>
              </div>

              {incluidoPorRol ? (
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3 text-xs font-semibold leading-5 text-indigo-800">
                  El rol de {ETIQUETAS_ROL[usuario.rol]?.toLowerCase() ?? usuario.rol} ya incluye este acceso.
                </div>
              ) : (
                <label className={`mt-4 flex min-h-14 items-center justify-between rounded-xl border px-3 py-2 ${cuentaActiva ? 'cursor-pointer border-slate-200 bg-slate-50' : 'border-slate-100 bg-slate-50 opacity-70'}`}>
                  <span className="pr-3">
                    <span className="block text-xs font-bold text-slate-800">Acceso al Centro Pastoral</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">Podrá crear sus propios bosquejos, colecciones, recursos y materiales.</span>
                  </span>
                  <span className="relative inline-flex h-7 w-12 shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={usuario.acceso_centro_pastoral}
                      disabled={estaProcesando}
                      onChange={() => cambiarAcceso(usuario)}
                    />
                    <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-indigo-600 peer-disabled:opacity-50" />
                    <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5">
                      {estaProcesando && <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />}
                    </span>
                  </span>
                </label>
              )}

              {!cuentaActiva && usuario.acceso_centro_pastoral && !incluidoPorRol && (
                <p className="mt-2 text-[11px] leading-4 text-amber-700">El permiso está guardado, pero se activará únicamente cuando la cuenta vuelva a estar activa.</p>
              )}
            </article>
          )
        })}

        {filtrados.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-8 text-center">
            <ShieldCheck className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">No se encontraron cuentas</p>
            <p className="mt-1 text-xs text-slate-500">Cambia el filtro o escribe otro nombre.</p>
          </div>
        )}
      </section>
    </>
  )
}
