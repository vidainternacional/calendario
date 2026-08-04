'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, Loader2, X } from 'lucide-react'
import { addHours, format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { crearEventoCalendario } from '@/app/actions/eventos'
import styles from './CalendarioIOS.module.css'

type MinisterioGestionado = {
  id: string
  nombre: string
  color_primario?: string | null
}

type Miembro = {
  id: string
  nombre: string
}

export default function NuevoEventoCalendarioModal({
  isOpen,
  onClose,
  onCreated,
  ministerios,
  puedeCrearGlobal,
  userId,
  fechaInicial,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  ministerios: MinisterioGestionado[]
  puedeCrearGlobal: boolean
  userId: string
  fechaInicial: Date
}) {
  const [mounted, setMounted] = useState(false)
  const [todoElDia, setTodoElDia] = useState(false)
  const [ministerioId, setMinisterioId] = useState(ministerios[0]?.id || '')
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [cargandoMiembros, setCargandoMiembros] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [alertaDia, setAlertaDia] = useState(true)
  const [alertaHora, setAlertaHora] = useState(true)

  const inicioPredeterminado = useMemo(() => {
    const base = new Date(fechaInicial)
    const ahora = new Date()
    base.setHours(Math.max(ahora.getHours() + 1, 8), 0, 0, 0)
    return base
  }, [fechaInicial])

  const [inicio, setInicio] = useState(format(inicioPredeterminado, "yyyy-MM-dd'T'HH:mm"))
  const [fin, setFin] = useState(format(addHours(inicioPredeterminado, 1), "yyyy-MM-dd'T'HH:mm"))

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!isOpen) return
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = bodyOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!ministerioId && !puedeCrearGlobal && ministerios[0]?.id) {
      setMinisterioId(ministerios[0].id)
    }
  }, [isOpen, ministerioId, ministerios, puedeCrearGlobal])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    async function cargarMiembros() {
      setCargandoMiembros(true)
      const supabase = createClient()

      try {
        if (ministerioId) {
          const { data } = await supabase
            .from('ministerio_miembros')
            .select('profile_id, profiles(id, nombre_completo)')
            .eq('ministerio_id', ministerioId)

          if (!cancelled) {
            setMiembros(
              (data || [])
                .map((item: any) => ({
                  id: item.profile_id,
                  nombre: item.profiles?.nombre_completo || 'Miembro',
                }))
                .filter((item: Miembro) => item.id !== userId),
            )
          }
          return
        }

        if (puedeCrearGlobal) {
          const { data } = await supabase
            .from('profiles')
            .select('id, nombre_completo')
            .eq('activo', true)
            .eq('estado_cuenta', 'activo')
            .order('nombre_completo')

          if (!cancelled) {
            setMiembros(
              (data || [])
                .map((item: any) => ({ id: item.id, nombre: item.nombre_completo || 'Miembro' }))
                .filter((item: Miembro) => item.id !== userId),
            )
          }
        }
      } finally {
        if (!cancelled) setCargandoMiembros(false)
      }
    }

    void cargarMiembros()
    return () => {
      cancelled = true
    }
  }, [isOpen, ministerioId, puedeCrearGlobal, userId])

  useEffect(() => {
    if (!isOpen) return
    const base = new Date(fechaInicial)
    const ahora = new Date()
    base.setHours(Math.max(ahora.getHours() + 1, 8), 0, 0, 0)
    setInicio(format(base, "yyyy-MM-dd'T'HH:mm"))
    setFin(format(addHours(base, 1), "yyyy-MM-dd'T'HH:mm"))
    setError('')
  }, [isOpen, fechaInicial])

  if (!mounted || !isOpen) return null

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setGuardando(true)

    const formData = new FormData(event.currentTarget)
    const inicioDate = new Date(inicio)
    const finDate = new Date(fin)

    if (Number.isNaN(inicioDate.getTime()) || Number.isNaN(finDate.getTime())) {
      setError('Selecciona una fecha y hora válidas.')
      setGuardando(false)
      return
    }

    formData.set('fecha_inicio', inicioDate.toISOString())
    formData.set('fecha_fin', finDate.toISOString())
    formData.set('todo_el_dia', todoElDia ? 'true' : 'false')
    formData.set('notif_1d', alertaDia ? 'true' : 'false')
    formData.set('notif_1h', alertaHora ? 'true' : 'false')

    const result = await crearEventoCalendario(formData)
    setGuardando(false)

    if (!result.success) {
      setError(result.error || 'No fue posible guardar el evento.')
      return
    }

    onCreated()
    onClose()
  }

  return createPortal(
    <div className={styles.newEventOverlay} role="dialog" aria-modal="true" aria-labelledby="nuevo-evento-titulo">
      <form onSubmit={guardar}>
        <header className={styles.newEventTopbar}>
          <button type="button" onClick={onClose} className={styles.roundAction} aria-label="Cancelar">
            <X size={23} />
          </button>
          <h2 id="nuevo-evento-titulo" className={styles.newEventTitle}>Nuevo evento</h2>
          <button
            type="submit"
            disabled={guardando}
            className={`${styles.roundAction} ${styles.roundActionPrimary}`}
            aria-label="Guardar evento"
          >
            {guardando ? <Loader2 size={21} className="animate-spin" /> : <Check size={23} />}
          </button>
        </header>

        <div className={styles.formBody}>
          <section className={styles.formGroup}>
            <div className={styles.formColumn}>
              <input name="titulo" required maxLength={140} autoFocus className={styles.formInput} placeholder="Título" />
            </div>
            <div className={styles.formColumn}>
              <input name="ubicacion" maxLength={240} className={styles.formInput} placeholder="Ubicación" />
            </div>
          </section>

          <section className={styles.formGroup}>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Todo el día</span>
              <button
                type="button"
                role="switch"
                aria-checked={todoElDia}
                onClick={() => setTodoElDia((actual) => !actual)}
                className={`${styles.switch} ${todoElDia ? styles.switchOn : ''}`}
              >
                <span className={styles.switchThumb} />
              </button>
            </div>
            <label className={styles.formRow}>
              <span className={styles.formLabel}>Comienza</span>
              <input
                type={todoElDia ? 'date' : 'datetime-local'}
                value={todoElDia ? inicio.slice(0, 10) : inicio}
                onChange={(event) => {
                  const valor = todoElDia ? `${event.target.value}T00:00` : event.target.value
                  setInicio(valor)
                  const nuevaFecha = new Date(valor)
                  if (!Number.isNaN(nuevaFecha.getTime())) {
                    setFin(format(addHours(nuevaFecha, todoElDia ? 24 : 1), "yyyy-MM-dd'T'HH:mm"))
                  }
                }}
                className={styles.formInput}
              />
            </label>
            <label className={styles.formRow}>
              <span className={styles.formLabel}>Termina</span>
              <input
                type={todoElDia ? 'date' : 'datetime-local'}
                value={todoElDia ? fin.slice(0, 10) : fin}
                onChange={(event) => setFin(todoElDia ? `${event.target.value}T23:59` : event.target.value)}
                className={styles.formInput}
              />
            </label>
          </section>

          <section className={styles.formGroup}>
            <label className={styles.formColumn}>
              <span className={styles.formLabel}>Ministerio</span>
              <select
                name="ministerio_id"
                value={ministerioId}
                onChange={(event) => setMinisterioId(event.target.value)}
                className={styles.formSelect}
                required={!puedeCrearGlobal}
              >
                {puedeCrearGlobal && <option value="">Evento general</option>}
                {ministerios.map((ministerio) => (
                  <option key={ministerio.id} value={ministerio.id}>{ministerio.nombre}</option>
                ))}
              </select>
            </label>

            <div className={styles.formColumn}>
              <span className={styles.formLabel}>Participantes</span>
              {cargandoMiembros ? (
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" /> Cargando miembros…
                </span>
              ) : miembros.length > 0 ? (
                <div className={styles.membersList}>
                  {miembros.map((miembro) => (
                    <label key={miembro.id} className={styles.memberOption}>
                      <input type="checkbox" name="participantes" value={miembro.id} />
                      <span>{miembro.nombre}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-slate-500">El evento quedará asignado a usted.</span>
              )}
            </div>
          </section>

          <section className={styles.formGroup}>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Avisar un día antes</span>
              <button
                type="button"
                role="switch"
                aria-checked={alertaDia}
                onClick={() => setAlertaDia((actual) => !actual)}
                className={`${styles.switch} ${alertaDia ? styles.switchOn : ''}`}
              >
                <span className={styles.switchThumb} />
              </button>
            </div>
            <div className={styles.formRow}>
              <span className={styles.formLabel}>Avisar una hora antes</span>
              <button
                type="button"
                role="switch"
                aria-checked={alertaHora}
                onClick={() => setAlertaHora((actual) => !actual)}
                className={`${styles.switch} ${alertaHora ? styles.switchOn : ''}`}
              >
                <span className={styles.switchThumb} />
              </button>
            </div>
          </section>

          <section className={styles.formGroup}>
            <label className={styles.formColumn}>
              <span className={styles.formLabel}>Notas</span>
              <textarea
                name="descripcion"
                maxLength={4000}
                className={styles.formTextarea}
                placeholder="Descripción o indicaciones del evento"
              />
            </label>
          </section>

          {error && <p className={styles.formError}>{error}</p>}
        </div>
      </form>
    </div>,
    document.body,
  )
}
