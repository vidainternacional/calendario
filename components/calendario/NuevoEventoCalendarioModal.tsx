'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, CalendarDays, Check, Loader2, X } from 'lucide-react'
import { addHours, format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { crearEventoCalendario } from '@/app/actions/eventos'
import type { CalendarioOrigen } from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'

type Miembro = {
  id: string
  nombre: string
}

type ItemType = 'event' | 'reminder'

export default function NuevoEventoCalendarioModal({
  isOpen,
  onClose,
  onCreated,
  editableCalendars,
  userId,
  fechaInicial,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  editableCalendars: CalendarioOrigen[]
  userId: string
  fechaInicial: Date
}) {
  const [mounted, setMounted] = useState(false)
  const [itemType, setItemType] = useState<ItemType>('event')
  const [todoElDia, setTodoElDia] = useState(false)
  const [calendarId, setCalendarId] = useState(editableCalendars[0]?.id || '')
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [cargandoMiembros, setCargandoMiembros] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [alertaDia, setAlertaDia] = useState(true)
  const [alertaHora, setAlertaHora] = useState(true)

  const selectedCalendar = useMemo(
    () => editableCalendars.find((calendar) => calendar.id === calendarId) || editableCalendars[0] || null,
    [calendarId, editableCalendars],
  )

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
    if (!editableCalendars.some((calendar) => calendar.id === calendarId)) {
      setCalendarId(editableCalendars[0]?.id || '')
    }
  }, [calendarId, editableCalendars, isOpen])

  useEffect(() => {
    if (!isOpen || itemType === 'reminder' || !selectedCalendar) {
      setMiembros([])
      return
    }

    let cancelled = false

    async function cargarMiembros() {
      setCargandoMiembros(true)
      const supabase = createClient()

      try {
        if (selectedCalendar.ministerio_id) {
          const { data } = await supabase
            .from('ministerio_miembros')
            .select('profile_id, profiles(id, nombre_completo)')
            .eq('ministerio_id', selectedCalendar.ministerio_id)

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
      } finally {
        if (!cancelled) setCargandoMiembros(false)
      }
    }

    void cargarMiembros()
    return () => {
      cancelled = true
    }
  }, [isOpen, itemType, selectedCalendar?.id, selectedCalendar?.ministerio_id, userId])

  useEffect(() => {
    if (!isOpen) return
    const base = new Date(fechaInicial)
    const ahora = new Date()
    base.setHours(Math.max(ahora.getHours() + 1, 8), 0, 0, 0)
    setInicio(format(base, "yyyy-MM-dd'T'HH:mm"))
    setFin(format(addHours(base, 1), "yyyy-MM-dd'T'HH:mm"))
    setItemType('event')
    setTodoElDia(false)
    setError('')
  }, [isOpen, fechaInicial])

  if (!mounted || !isOpen) return null

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!selectedCalendar) {
      setError('No hay un calendario editable disponible.')
      return
    }

    const inicioDate = new Date(inicio)
    const finDate = new Date(fin)

    if (Number.isNaN(inicioDate.getTime())) {
      setError('Selecciona una fecha y hora válidas.')
      return
    }

    if (itemType === 'event' && (Number.isNaN(finDate.getTime()) || finDate <= inicioDate)) {
      setError('La fecha de finalización debe ser posterior al inicio.')
      return
    }

    setGuardando(true)
    const formData = new FormData(event.currentTarget)
    formData.set('item_type', itemType)
    formData.set('calendar_id', selectedCalendar.id)
    formData.set('fecha_inicio', inicioDate.toISOString())
    formData.set('fecha_fin', itemType === 'event' ? finDate.toISOString() : inicioDate.toISOString())
    formData.set('todo_el_dia', itemType === 'event' && todoElDia ? 'true' : 'false')
    formData.set('notif_1d', itemType === 'event' && alertaDia ? 'true' : 'false')
    formData.set('notif_1h', itemType === 'event' && alertaHora ? 'true' : 'false')

    const result = await crearEventoCalendario(formData)
    setGuardando(false)

    if (!result.success) {
      setError(result.error || 'No fue posible guardar.')
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
          <h2 id="nuevo-evento-titulo" className={styles.newEventTitle}>Nuevo</h2>
          <button
            type="submit"
            disabled={guardando || !selectedCalendar}
            className={`${styles.roundAction} ${styles.roundActionPrimary}`}
            aria-label="Guardar"
          >
            {guardando ? <Loader2 size={21} className="animate-spin" /> : <Check size={23} />}
          </button>
        </header>

        <div className={styles.formBody}>
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Tipo de elemento">
            <button
              type="button"
              role="tab"
              aria-selected={itemType === 'event'}
              onClick={() => { setItemType('event'); setError('') }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${itemType === 'event' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <CalendarDays size={17} /> Evento
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={itemType === 'reminder'}
              onClick={() => { setItemType('reminder'); setError('') }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${itemType === 'reminder' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <BellRing size={17} /> Recordatorio
            </button>
          </div>

          <section className={styles.formGroup}>
            <div className={styles.formColumn}>
              <input name="titulo" required maxLength={140} autoFocus className={styles.formInput} placeholder="Título" />
            </div>
            {itemType === 'event' && (
              <div className={styles.formColumn}>
                <input name="ubicacion" maxLength={240} className={styles.formInput} placeholder="Ubicación o videollamada" />
              </div>
            )}
          </section>

          <section className={styles.formGroup}>
            {itemType === 'event' && (
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
            )}

            <label className={styles.formRow}>
              <span className={styles.formLabel}>{itemType === 'reminder' ? 'Recordar' : 'Comienza'}</span>
              <input
                type={itemType === 'event' && todoElDia ? 'date' : 'datetime-local'}
                value={itemType === 'event' && todoElDia ? inicio.slice(0, 10) : inicio}
                onChange={(event) => {
                  const valor = itemType === 'event' && todoElDia ? `${event.target.value}T00:00` : event.target.value
                  setInicio(valor)
                  const nuevaFecha = new Date(valor)
                  if (itemType === 'event' && !Number.isNaN(nuevaFecha.getTime())) {
                    setFin(format(addHours(nuevaFecha, todoElDia ? 24 : 1), "yyyy-MM-dd'T'HH:mm"))
                  }
                }}
                className={styles.formInput}
                required
              />
            </label>

            {itemType === 'event' && (
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Termina</span>
                <input
                  type={todoElDia ? 'date' : 'datetime-local'}
                  value={todoElDia ? fin.slice(0, 10) : fin}
                  onChange={(event) => setFin(todoElDia ? `${event.target.value}T23:59` : event.target.value)}
                  className={styles.formInput}
                  required
                />
              </label>
            )}

            {itemType === 'event' && (
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Tiempo de viaje</span>
                <select name="tiempo_viaje_minutos" defaultValue="0" className={styles.formSelect}>
                  <option value="0">Ninguno</option>
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </label>
            )}
          </section>

          <section className={styles.formGroup}>
            <label className={styles.formColumn}>
              <span className={styles.formLabel}>Calendario</span>
              <select
                name="calendar_id"
                value={calendarId}
                onChange={(event) => setCalendarId(event.target.value)}
                className={styles.formSelect}
                required
              >
                {editableCalendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>{calendar.nombre}</option>
                ))}
              </select>
            </label>

            {itemType === 'event' && (
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
            )}
          </section>

          {itemType === 'event' && (
            <section className={styles.formGroup}>
              <div className={styles.formRow}>
                <span className={styles.formLabel}>Avisar un día antes</span>
                <button type="button" role="switch" aria-checked={alertaDia} onClick={() => setAlertaDia((actual) => !actual)} className={`${styles.switch} ${alertaDia ? styles.switchOn : ''}`}>
                  <span className={styles.switchThumb} />
                </button>
              </div>
              <div className={styles.formRow}>
                <span className={styles.formLabel}>Avisar una hora antes</span>
                <button type="button" role="switch" aria-checked={alertaHora} onClick={() => setAlertaHora((actual) => !actual)} className={`${styles.switch} ${alertaHora ? styles.switchOn : ''}`}>
                  <span className={styles.switchThumb} />
                </button>
              </div>
            </section>
          )}

          <section className={styles.formGroup}>
            <label className={styles.formColumn}>
              <span className={styles.formLabel}>Notas</span>
              <textarea
                name="descripcion"
                maxLength={4000}
                className={styles.formTextarea}
                placeholder={itemType === 'reminder' ? 'Nota del recordatorio' : 'Descripción o indicaciones del evento'}
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
