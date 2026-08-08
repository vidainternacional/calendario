'use client'

import { addHours, format } from 'date-fns'
import { Check, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { crearEventoCalendario } from '@/app/actions/eventos'
import type { CalendarioOrigen } from './calendario-ios-types'
import formStyles from './NuevoEventoCalendarioModal.module.css'

type ItemType = 'event' | 'reminder'

function etiquetaCalendario(calendar: CalendarioOrigen) {
  if (calendar.es_publico && !calendar.ministerio_id) {
    return 'Toda la congregación — Vida Internacional'
  }
  return calendar.nombre
}

export default function NuevoEventoCalendarioModal({
  isOpen,
  onClose,
  onCreated,
  editableCalendars,
  fechaInicial,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  editableCalendars: CalendarioOrigen[]
  fechaInicial: Date
}) {
  const [mounted, setMounted] = useState(false)
  const [itemType, setItemType] = useState<ItemType>('event')
  const [todoElDia, setTodoElDia] = useState(false)
  const [calendarId, setCalendarId] = useState(editableCalendars[0]?.id || '')
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
      setError('No hay un calendario disponible para guardar este elemento.')
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

  const titlePlaceholder = itemType === 'event' ? 'Título' : 'Nombre del recordatorio'

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
            aria-label="Cancelar"
          >
            <X size={29} strokeWidth={2.15} aria-hidden="true" />
          </button>

          <h2 id="nuevo-evento-titulo" className={formStyles.title}>Nuevo</h2>

          <button
            type="submit"
            disabled={guardando || !selectedCalendar}
            className={formStyles.saveButton}
            aria-label={guardando ? 'Guardando' : 'Añadir'}
          >
            {guardando
              ? <Loader2 size={23} className="animate-spin" aria-hidden="true" />
              : <Check size={30} strokeWidth={2.2} aria-hidden="true" />}
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
                Recordatorio
              </button>
            </div>

            <section className={`${formStyles.group} ${formStyles.primaryGroup}`}>
              <div className={formStyles.column}>
                <input
                  name="titulo"
                  required
                  maxLength={140}
                  autoFocus
                  className={`${formStyles.input} ${formStyles.primaryInput}`}
                  placeholder={titlePlaceholder}
                  aria-label="Título"
                />
              </div>

              {itemType === 'event' ? (
                <div className={formStyles.column}>
                  <input
                    name="ubicacion"
                    maxLength={240}
                    className={`${formStyles.input} ${formStyles.secondaryInput}`}
                    placeholder="Ubicación o videollamada"
                    aria-label="Ubicación o videollamada"
                  />
                </div>
              ) : (
                <div className={formStyles.column}>
                  <textarea
                    name="descripcion"
                    maxLength={4000}
                    className={`${formStyles.textarea} ${formStyles.reminderNotes}`}
                    placeholder="Notas"
                    aria-label="Notas"
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
                  className={`${formStyles.input} ${formStyles.dateInput}`}
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
                    className={`${formStyles.input} ${formStyles.dateInput}`}
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

            <p className={formStyles.sectionLabel}>Audiencia</p>
            <section className={formStyles.group}>
              <label className={formStyles.row}>
                <span className={formStyles.label}>Calendario</span>
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
                    className={`${formStyles.select} ${formStyles.calendarSelect}`}
                    required
                    aria-label="Calendario o audiencia"
                  >
                    {editableCalendars.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>{etiquetaCalendario(calendar)}</option>
                    ))}
                  </select>
                </span>
              </label>
            </section>

            {itemType === 'event' && (
              <section className={`${formStyles.group} ${formStyles.spacedGroup}`}>
                <div className={formStyles.row}>
                  <span className={formStyles.label}>Avisar un día antes</span>
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
                  <span className={formStyles.label}>Avisar una hora antes</span>
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
            )}

            {itemType === 'event' && (
              <section className={`${formStyles.group} ${formStyles.spacedGroup}`}>
                <div className={formStyles.column}>
                  <textarea
                    name="descripcion"
                    maxLength={4000}
                    className={formStyles.textarea}
                    placeholder="Notas"
                    aria-label="Notas"
                  />
                </div>
              </section>
            )}

            {error && <p className={formStyles.error} role="alert">{error}</p>}
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
