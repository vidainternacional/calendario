'use client'

import { addHours, format } from 'date-fns'
import { BellRing, CalendarDays, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { crearEventoCalendario } from '@/app/actions/eventos'
import { createClient } from '@/lib/supabase/client'
import type { CalendarioOrigen } from './calendario-ios-types'
import formStyles from './NuevoEventoCalendarioModal.module.css'

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !guardando) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = bodyOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [guardando, isOpen, onClose])

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
  }, [isOpen, itemType, selectedCalendar, userId])

  useEffect(() => {
    if (!isOpen) return

    const base = new Date(fechaInicial)
    const ahora = new Date()
    base.setHours(Math.max(ahora.getHours() + 1, 8), 0, 0, 0)
    setInicio(format(base, "yyyy-MM-dd'T'HH:mm"))
    setFin(format(addHours(base, 1), "yyyy-MM-dd'T'HH:mm"))
    setItemType('event')
    setTodoElDia(false)
    setAlertaDia(true)
    setAlertaHora(true)
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
    <div
      className={formStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nuevo-evento-titulo"
    >
      <form className={formStyles.form} onSubmit={guardar}>
        <header className={formStyles.topbar}>
          <button
            type="button"
            onClick={onClose}
            className={formStyles.cancelButton}
            disabled={guardando}
          >
            Cancelar
          </button>
          <h2 id="nuevo-evento-titulo" className={formStyles.title}>
            {itemType === 'event' ? 'Nuevo evento' : 'Nuevo recordatorio'}
          </h2>
          <button
            type="submit"
            disabled={guardando || !selectedCalendar}
            className={formStyles.saveButton}
          >
            {guardando && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
            {guardando ? 'Guardando' : 'Añadir'}
          </button>
        </header>

        <div className={formStyles.body}>
          <div className={formStyles.content}>
            <div className={formStyles.segmented} role="tablist" aria-label="Tipo de elemento">
              <button
                type="button"
                role="tab"
                aria-selected={itemType === 'event'}
                onClick={() => {
                  setItemType('event')
                  setError('')
                }}
                className={`${formStyles.segment} ${itemType === 'event' ? formStyles.segmentActive : ''}`}
              >
                <CalendarDays size={17} aria-hidden="true" />
                Evento
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={itemType === 'reminder'}
                onClick={() => {
                  setItemType('reminder')
                  setError('')
                }}
                className={`${formStyles.segment} ${itemType === 'reminder' ? formStyles.segmentActive : ''}`}
              >
                <BellRing size={17} aria-hidden="true" />
                Recordatorio
              </button>
            </div>

            <p className={formStyles.sectionLabel}>Información</p>
            <section className={formStyles.group}>
              <div className={formStyles.column}>
                <input
                  name="titulo"
                  required
                  maxLength={140}
                  autoFocus
                  className={`${formStyles.input} ${formStyles.primaryInput}`}
                  placeholder={itemType === 'event' ? 'Título' : 'Nombre del recordatorio'}
                  aria-label="Título"
                />
              </div>
              {itemType === 'event' && (
                <div className={formStyles.column}>
                  <input
                    name="ubicacion"
                    maxLength={240}
                    className={`${formStyles.input} ${formStyles.secondaryInput}`}
                    placeholder="Ubicación o videollamada"
                    aria-label="Ubicación o videollamada"
                  />
                </div>
              )}
            </section>

            <p className={formStyles.sectionLabel}>Fecha y hora</p>
            <section className={formStyles.group}>
              {itemType === 'event' && (
                <div className={formStyles.row}>
                  <span className={formStyles.label}>Todo el día</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={todoElDia}
                    aria-label="Evento de todo el día"
                    onClick={() => setTodoElDia((actual) => !actual)}
                    className={`${formStyles.switch} ${todoElDia ? formStyles.switchOn : ''}`}
                  >
                    <span className={formStyles.switchThumb} />
                  </button>
                </div>
              )}

              <label className={formStyles.row}>
                <span className={formStyles.label}>{itemType === 'reminder' ? 'Recordar' : 'Comienza'}</span>
                <input
                  type={itemType === 'event' && todoElDia ? 'date' : 'datetime-local'}
                  value={itemType === 'event' && todoElDia ? inicio.slice(0, 10) : inicio}
                  onChange={(event) => {
                    const valor = itemType === 'event' && todoElDia
                      ? `${event.target.value}T00:00`
                      : event.target.value
                    setInicio(valor)
                    const nuevaFecha = new Date(valor)
                    if (itemType === 'event' && !Number.isNaN(nuevaFecha.getTime())) {
                      setFin(format(addHours(nuevaFecha, todoElDia ? 24 : 1), "yyyy-MM-dd'T'HH:mm"))
                    }
                  }}
                  className={formStyles.input}
                  required
                />
              </label>

              {itemType === 'event' && (
                <label className={formStyles.row}>
                  <span className={formStyles.label}>Termina</span>
                  <input
                    type={todoElDia ? 'date' : 'datetime-local'}
                    value={todoElDia ? fin.slice(0, 10) : fin}
                    onChange={(event) => setFin(todoElDia ? `${event.target.value}T23:59` : event.target.value)}
                    className={formStyles.input}
                    required
                  />
                </label>
              )}

              {itemType === 'event' && (
                <label className={formStyles.row}>
                  <span className={formStyles.label}>Tiempo de viaje</span>
                  <select name="tiempo_viaje_minutos" defaultValue="0" className={formStyles.select}>
                    <option value="0">Ninguno</option>
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </label>
              )}
            </section>

            <p className={formStyles.sectionLabel}>Calendario</p>
            <section className={formStyles.group}>
              <label className={formStyles.row}>
                <span className={formStyles.label}>Guardar en</span>
                <span className={formStyles.calendarValue}>
                  <span
                    className={formStyles.calendarDot}
                    style={{ backgroundColor: selectedCalendar?.color || '#5b3df5' }}
                    aria-hidden="true"
                  />
                  <select
                    name="calendar_id"
                    value={calendarId}
                    onChange={(event) => setCalendarId(event.target.value)}
                    className={formStyles.select}
                    required
                    aria-label="Calendario"
                  >
                    {editableCalendars.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>{calendar.nombre}</option>
                    ))}
                  </select>
                </span>
              </label>
            </section>

            {itemType === 'event' && (
              <>
                <p className={formStyles.sectionLabel}>Participantes</p>
                <section className={formStyles.group}>
                  <div className={formStyles.column}>
                    {cargandoMiembros ? (
                      <span className={formStyles.membersIntro}>
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        Cargando miembros…
                      </span>
                    ) : miembros.length > 0 ? (
                      <div className={formStyles.membersList}>
                        {miembros.map((miembro) => (
                          <label key={miembro.id} className={formStyles.memberOption}>
                            <input type="checkbox" name="participantes" value={miembro.id} />
                            <span>{miembro.nombre}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <span className={formStyles.membersIntro}>El evento quedará asignado a usted.</span>
                    )}
                  </div>
                </section>

                <p className={formStyles.sectionLabel}>Avisos</p>
                <section className={formStyles.group}>
                  <div className={formStyles.row}>
                    <span className={formStyles.label}>Un día antes</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={alertaDia}
                      aria-label="Avisar un día antes"
                      onClick={() => setAlertaDia((actual) => !actual)}
                      className={`${formStyles.switch} ${alertaDia ? formStyles.switchOn : ''}`}
                    >
                      <span className={formStyles.switchThumb} />
                    </button>
                  </div>
                  <div className={formStyles.row}>
                    <span className={formStyles.label}>Una hora antes</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={alertaHora}
                      aria-label="Avisar una hora antes"
                      onClick={() => setAlertaHora((actual) => !actual)}
                      className={`${formStyles.switch} ${alertaHora ? formStyles.switchOn : ''}`}
                    >
                      <span className={formStyles.switchThumb} />
                    </button>
                  </div>
                </section>
              </>
            )}

            <p className={formStyles.sectionLabel}>Notas</p>
            <section className={formStyles.group}>
              <div className={formStyles.column}>
                <textarea
                  name="descripcion"
                  maxLength={4000}
                  className={formStyles.textarea}
                  placeholder={itemType === 'reminder'
                    ? 'Nota del recordatorio'
                    : 'Descripción o indicaciones del evento'}
                  aria-label="Notas"
                />
              </div>
            </section>

            {error && <p className={formStyles.error} role="alert">{error}</p>}
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
