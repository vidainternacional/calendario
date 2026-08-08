'use client'

import { addHours, format } from 'date-fns'
import { Check, ChevronRight, Loader2, X } from 'lucide-react'
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
  userId?: string
  fechaInicial: Date
}) {
  const [mounted, setMounted] = useState(false)
  const [itemType, setItemType] = useState<ItemType>('event')
  const [todoElDia, setTodoElDia] = useState(false)
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(
    editableCalendars[0]?.id ? [editableCalendars[0].id] : [],
  )
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [alertaDia, setAlertaDia] = useState(true)
  const [alertaHora, setAlertaHora] = useState(true)

  const selectedCalendars = useMemo(
    () => editableCalendars.filter((calendar) => selectedCalendarIds.includes(calendar.id)),
    [editableCalendars, selectedCalendarIds],
  )

  const primaryCalendar = selectedCalendars[0] || null

  const calendarSummary = useMemo(() => {
    if (selectedCalendars.length === 0) return 'Seleccionar'
    if (selectedCalendars.length === 1) return etiquetaCalendario(selectedCalendars[0])
    if (selectedCalendars.length === editableCalendars.length) return 'Todos los calendarios'
    return `${selectedCalendars.length} calendarios`
  }, [editableCalendars.length, selectedCalendars])

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
      if (event.key !== 'Escape' || guardando) return
      if (calendarPickerOpen) setCalendarPickerOpen(false)
      else onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = bodyOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [calendarPickerOpen, guardando, isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return

    const allowedIds = new Set(editableCalendars.map((calendar) => calendar.id))
    setSelectedCalendarIds((current) => {
      const valid = current.filter((id) => allowedIds.has(id))
      if (valid.length > 0) return itemType === 'reminder' ? [valid[0]] : valid
      return editableCalendars[0]?.id ? [editableCalendars[0].id] : []
    })
  }, [editableCalendars, isOpen, itemType])

  useEffect(() => {
    if (!isOpen) return

    const base = new Date(fechaInicial)
    const ahora = new Date()
    base.setHours(Math.max(ahora.getHours() + 1, 8), 0, 0, 0)
    setInicio(format(base, "yyyy-MM-dd'T'HH:mm"))
    setFin(format(addHours(base, 1), "yyyy-MM-dd'T'HH:mm"))
    setItemType('event')
    setTodoElDia(false)
    setSelectedCalendarIds(editableCalendars[0]?.id ? [editableCalendars[0].id] : [])
    setCalendarPickerOpen(false)
    setAlertaDia(true)
    setAlertaHora(true)
    setError('')
  }, [editableCalendars, fechaInicial, isOpen])

  if (!mounted || !isOpen) return null

  function toggleCalendar(calendarId: string) {
    if (itemType === 'reminder') {
      setSelectedCalendarIds([calendarId])
      setCalendarPickerOpen(false)
      return
    }

    setSelectedCalendarIds((current) => (
      current.includes(calendarId)
        ? current.filter((id) => id !== calendarId)
        : [...current, calendarId]
    ))
  }

  function selectAllCalendars() {
    if (itemType === 'reminder') return
    const allIds = editableCalendars.map((calendar) => calendar.id)
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedCalendarIds.includes(id))
    setSelectedCalendarIds(allSelected ? [] : allIds)
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!primaryCalendar || selectedCalendars.length === 0) {
      setError('Selecciona al menos un calendario.')
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
    formData.set('calendar_id', primaryCalendar.id)
    formData.delete('calendar_ids')
    selectedCalendars.forEach((calendar) => formData.append('calendar_ids', calendar.id))
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
  const allCalendarsSelected = editableCalendars.length > 0
    && editableCalendars.every((calendar) => selectedCalendarIds.includes(calendar.id))

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
            disabled={guardando || selectedCalendars.length === 0}
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
                  setSelectedCalendarIds((current) => current[0] ? [current[0]] : [])
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
              <button
                type="button"
                className={`${formStyles.row} ${formStyles.calendarPickerButton}`}
                onClick={() => setCalendarPickerOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={calendarPickerOpen}
              >
                <span className={formStyles.label}>
                  {itemType === 'event' ? 'Calendarios' : 'Calendario'}
                </span>
                <span className={formStyles.calendarPickerValue}>
                  <span className={formStyles.calendarDots} aria-hidden="true">
                    {selectedCalendars.slice(0, 4).map((calendar) => (
                      <span
                        key={calendar.id}
                        className={formStyles.calendarDot}
                        style={{ backgroundColor: calendar.color || '#5b3df5' }}
                      />
                    ))}
                  </span>
                  <span className={formStyles.calendarSummary}>{calendarSummary}</span>
                  <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
                </span>
              </button>
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

        {calendarPickerOpen && (
          <div className={formStyles.pickerLayer} role="dialog" aria-modal="true" aria-label="Seleccionar calendarios">
            <button
              type="button"
              className={formStyles.pickerBackdrop}
              onClick={() => setCalendarPickerOpen(false)}
              aria-label="Cerrar selección de calendarios"
            />
            <section className={formStyles.pickerSheet}>
              <header className={formStyles.pickerHeader}>
                <button
                  type="button"
                  className={formStyles.pickerTextButton}
                  onClick={() => setCalendarPickerOpen(false)}
                >
                  Listo
                </button>
                <h3>{itemType === 'event' ? 'Calendarios' : 'Calendario'}</h3>
                {itemType === 'event' ? (
                  <button
                    type="button"
                    className={formStyles.pickerTextButton}
                    onClick={selectAllCalendars}
                  >
                    {allCalendarsSelected ? 'Ninguno' : 'Todos'}
                  </button>
                ) : <span />}
              </header>

              <div className={formStyles.pickerList}>
                {editableCalendars.map((calendar) => {
                  const selected = selectedCalendarIds.includes(calendar.id)
                  return (
                    <button
                      key={calendar.id}
                      type="button"
                      className={formStyles.pickerOption}
                      onClick={() => toggleCalendar(calendar.id)}
                      aria-pressed={selected}
                    >
                      <span
                        className={formStyles.pickerDot}
                        style={{ backgroundColor: calendar.color || '#5b3df5' }}
                        aria-hidden="true"
                      />
                      <span className={formStyles.pickerOptionText}>
                        <strong>{etiquetaCalendario(calendar)}</strong>
                        {calendar.ministerio_id && <small>Ministerio</small>}
                        {!calendar.ministerio_id && calendar.nombre.toLowerCase() === 'pastores' && <small>Solo pastores y administración</small>}
                      </span>
                      <span className={`${formStyles.pickerCheck} ${selected ? formStyles.pickerCheckSelected : ''}`}>
                        {selected && <Check size={17} strokeWidth={2.6} aria-hidden="true" />}
                      </span>
                    </button>
                  )
                })}
              </div>

              {itemType === 'event' && selectedCalendars.length === 0 && (
                <p className={formStyles.pickerHint}>Selecciona al menos un calendario para guardar el evento.</p>
              )}
            </section>
          </div>
        )}
      </form>
    </div>,
    document.body,
  )
}
