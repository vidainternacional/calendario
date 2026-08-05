'use client'

import { addHours, format } from 'date-fns'
import { Check, Loader2, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  actualizarElementoCalendario,
  eliminarElementoCalendario,
} from '@/app/actions/eventos'
import type { EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioIOS.module.css'

export default function EditarElementoCalendarioModal({
  item,
  isOpen,
  onClose,
  onSaved,
}: {
  item: EventoCalendario | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [todoElDia, setTodoElDia] = useState(false)
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  const isReminder = item?.kind === 'reminder'

  const initialStart = useMemo(
    () => item ? format(new Date(item.fecha_inicio), "yyyy-MM-dd'T'HH:mm") : '',
    [item],
  )
  const initialEnd = useMemo(() => {
    if (!item) return ''
    const end = item.fecha_fin ? new Date(item.fecha_fin) : addHours(new Date(item.fecha_inicio), 1)
    return format(end, "yyyy-MM-dd'T'HH:mm")
  }, [item])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!isOpen || !item) return
    setTodoElDia(Boolean(item.todo_el_dia))
    setInicio(initialStart)
    setFin(initialEnd)
    setError('')
  }, [isOpen, item, initialStart, initialEnd])

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  if (!mounted || !isOpen || !item) return null

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const startDate = new Date(inicio)
    const endDate = new Date(fin)
    if (Number.isNaN(startDate.getTime())) {
      setError('Selecciona una fecha válida.')
      return
    }
    if (!isReminder && (Number.isNaN(endDate.getTime()) || endDate <= startDate)) {
      setError('La fecha de finalización debe ser posterior al inicio.')
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.set('item_id', item.id)
    formData.set('item_type', item.kind)
    formData.set('fecha_inicio', startDate.toISOString())
    formData.set('fecha_fin', isReminder ? startDate.toISOString() : endDate.toISOString())
    formData.set('todo_el_dia', !isReminder && todoElDia ? 'true' : 'false')

    setGuardando(true)
    const result = await actualizarElementoCalendario(formData)
    setGuardando(false)

    if (!result.success) {
      setError(result.error || 'No fue posible actualizar.')
      return
    }

    onSaved()
    onClose()
  }

  async function eliminar() {
    const confirmed = window.confirm(
      item.kind === 'reminder'
        ? '¿Eliminar este recordatorio?'
        : '¿Eliminar este evento? Las asignaciones relacionadas también dejarán de mostrarse.',
    )
    if (!confirmed) return

    const formData = new FormData()
    formData.set('item_id', item.id)
    formData.set('item_type', item.kind)

    setEliminando(true)
    setError('')
    const result = await eliminarElementoCalendario(formData)
    setEliminando(false)

    if (!result.success) {
      setError(result.error || 'No fue posible eliminar.')
      return
    }

    onSaved()
    onClose()
  }

  return createPortal(
    <div className={styles.newEventOverlay} role="dialog" aria-modal="true" aria-labelledby="editar-elemento-titulo">
      <form onSubmit={guardar}>
        <header className={styles.newEventTopbar}>
          <button type="button" onClick={onClose} className={styles.roundAction} aria-label="Cancelar">
            <X size={23} />
          </button>
          <h2 id="editar-elemento-titulo" className={styles.newEventTitle}>
            Editar {isReminder ? 'recordatorio' : 'evento'}
          </h2>
          <button
            type="submit"
            disabled={guardando || eliminando}
            className={`${styles.roundAction} ${styles.roundActionPrimary}`}
            aria-label="Guardar cambios"
          >
            {guardando ? <Loader2 size={21} className="animate-spin" /> : <Check size={23} />}
          </button>
        </header>

        <div className={styles.formBody}>
          <section className={styles.formGroup}>
            <div className={styles.formColumn}>
              <input
                name="titulo"
                required
                maxLength={140}
                defaultValue={item.titulo}
                className={styles.formInput}
                placeholder="Título"
              />
            </div>
            {!isReminder && (
              <div className={styles.formColumn}>
                <input
                  name="ubicacion"
                  maxLength={240}
                  defaultValue={item.ubicacion || ''}
                  className={styles.formInput}
                  placeholder="Ubicación o videollamada"
                />
              </div>
            )}
          </section>

          <section className={styles.formGroup}>
            {!isReminder && (
              <div className={styles.formRow}>
                <span className={styles.formLabel}>Todo el día</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={todoElDia}
                  onClick={() => setTodoElDia((current) => !current)}
                  className={`${styles.switch} ${todoElDia ? styles.switchOn : ''}`}
                >
                  <span className={styles.switchThumb} />
                </button>
              </div>
            )}

            <label className={styles.formRow}>
              <span className={styles.formLabel}>{isReminder ? 'Recordar' : 'Comienza'}</span>
              <input
                type={!isReminder && todoElDia ? 'date' : 'datetime-local'}
                value={!isReminder && todoElDia ? inicio.slice(0, 10) : inicio}
                onChange={(event) => {
                  const value = !isReminder && todoElDia ? `${event.target.value}T00:00` : event.target.value
                  setInicio(value)
                }}
                className={styles.formInput}
                required
              />
            </label>

            {!isReminder && (
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

            {!isReminder && (
              <label className={styles.formRow}>
                <span className={styles.formLabel}>Tiempo de viaje</span>
                <select
                  name="tiempo_viaje_minutos"
                  defaultValue={String(item.tiempo_viaje_minutos || 0)}
                  className={styles.formSelect}
                >
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
            <div className={styles.formColumn}>
              <span className={styles.formLabel}>Calendario</span>
              <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                {item.calendars?.nombre || 'Vida Internacional'}
              </div>
            </div>
          </section>

          <section className={styles.formGroup}>
            <label className={styles.formColumn}>
              <span className={styles.formLabel}>Notas</span>
              <textarea
                name="descripcion"
                maxLength={4000}
                defaultValue={item.descripcion || ''}
                className={styles.formTextarea}
                placeholder={isReminder ? 'Nota del recordatorio' : 'Descripción o indicaciones del evento'}
              />
            </label>
          </section>

          {error && <p className={styles.formError}>{error}</p>}

          <button
            type="button"
            onClick={eliminar}
            disabled={guardando || eliminando}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-700 disabled:opacity-60"
          >
            {eliminando ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            Eliminar {isReminder ? 'recordatorio' : 'evento'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
