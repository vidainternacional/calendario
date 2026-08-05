'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Check, ChevronRight, Info, Loader2, X } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import styles from './CalendarioSourcesPanel.module.css'

type CalendarSource = {
  calendar_id: string
  visible: boolean
  can_edit: boolean
  calendars: {
    id: string
    nombre: string
    color: string
    tipo_cuenta: 'interno' | 'gmail' | 'icloud' | 'other'
    es_publico: boolean
    ministerio_id?: string | null
  } | null
}

type CalendarChange = {
  id: string
  summary: string
  change_type: 'created' | 'updated' | 'deleted'
  created_at: string
  calendar_id: string
  calendars: { nombre: string; color: string } | null
  change_reads?: Array<{ read_at: string }> | null
}

const GROUP_LABELS: Record<string, string> = {
  interno: 'Vida Internacional',
  gmail: 'Gmail',
  icloud: 'iCloud',
  other: 'Otros',
}

export default function CalendarioSourcesPanel({
  isOpen,
  onClose,
  userId,
  onVisibilityChanged,
}: {
  isOpen: boolean
  onClose: () => void
  userId: string
  onVisibilityChanged: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [sources, setSources] = useState<CalendarSource[]>([])
  const [changes, setChanges] = useState<CalendarChange[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<CalendarSource | null>(null)
  const [tab, setTab] = useState<'calendars' | 'changes'>('calendars')
  const [error, setError] = useState('')

  useEffect(() => setMounted(true), [])

  const load = useCallback(async () => {
    if (!isOpen) return
    setLoading(true)
    setError('')
    const db = createClient() as any

    const [subscriptionsResult, changesResult] = await Promise.all([
      db
        .from('calendar_subscriptions')
        .select('calendar_id, visible, can_edit, calendars(id, nombre, color, tipo_cuenta, es_publico, ministerio_id)')
        .eq('user_id', userId)
        .order('created_at'),
      db
        .from('calendar_changes')
        .select('id, summary, change_type, created_at, calendar_id, calendars(nombre, color), change_reads!left(read_at)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    if (subscriptionsResult.error || changesResult.error) {
      console.error('[CalendarioSourcesPanel]', subscriptionsResult.error || changesResult.error)
      setError('No fue posible cargar los calendarios.')
    } else {
      setSources((subscriptionsResult.data || []) as CalendarSource[])
      setChanges((changesResult.data || []) as CalendarChange[])
    }
    setLoading(false)
  }, [isOpen, userId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!isOpen) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [isOpen])

  const groups = useMemo(() => {
    const map = new Map<string, CalendarSource[]>()
    for (const source of sources) {
      const key = source.calendars?.tipo_cuenta || 'other'
      map.set(key, [...(map.get(key) || []), source])
    }
    return [...map.entries()]
  }, [sources])

  const unreadCount = changes.filter((change) => !change.change_reads || change.change_reads.length === 0).length

  async function toggleVisibility(source: CalendarSource) {
    setSavingId(source.calendar_id)
    const db = createClient() as any
    const next = !source.visible
    const { error: updateError } = await db
      .from('calendar_subscriptions')
      .update({ visible: next })
      .eq('user_id', userId)
      .eq('calendar_id', source.calendar_id)

    if (updateError) {
      console.error('[CalendarioSourcesPanel] visibility', updateError)
      setError('No fue posible cambiar la visibilidad.')
    } else {
      setSources((current) => current.map((item) => item.calendar_id === source.calendar_id ? { ...item, visible: next } : item))
      onVisibilityChanged()
    }
    setSavingId(null)
  }

  async function markRead(change: CalendarChange) {
    const db = createClient() as any
    const { error: readError } = await db
      .from('change_reads')
      .upsert({ user_id: userId, change_id: change.id }, { onConflict: 'user_id,change_id' })

    if (!readError) {
      setChanges((current) => current.map((item) => item.id === change.id ? { ...item, change_reads: [{ read_at: new Date().toISOString() }] } : item))
    }
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="calendar-sources-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.sheet}>
        <header className={styles.header}>
          <div>
            <h2 id="calendar-sources-title">Calendarios</h2>
            <p>Elige qué fuentes aparecen en tus vistas.</p>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </header>

        <div className={styles.tabs}>
          <button className={tab === 'calendars' ? styles.tabActive : ''} onClick={() => setTab('calendars')}>Calendarios</button>
          <button className={tab === 'changes' ? styles.tabActive : ''} onClick={() => setTab('changes')}>
            Cambios {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loading}><Loader2 size={22} className="animate-spin" /> Cargando…</div>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : tab === 'calendars' ? (
            groups.map(([group, items]) => (
              <section key={group} className={styles.group}>
                <h3>{GROUP_LABELS[group] || group}</h3>
                {items.map((source) => (
                  <div key={source.calendar_id} className={styles.sourceRow}>
                    <button className={styles.visibility} onClick={() => toggleVisibility(source)} disabled={savingId === source.calendar_id} aria-label={`${source.visible ? 'Ocultar' : 'Mostrar'} ${source.calendars?.nombre || 'calendario'}`}>
                      <span className={styles.colorDot} style={{ backgroundColor: source.calendars?.color || '#5B3DF5' }}>
                        {source.visible && <Check size={13} />}
                      </span>
                      <span className={styles.sourceText}>
                        <strong>{source.calendars?.nombre || 'Calendario'}</strong>
                        <small>{source.can_edit ? 'Puede editar' : 'Solo lectura'}</small>
                      </span>
                    </button>
                    <button className={styles.infoButton} onClick={() => setSelectedSource(source)} aria-label="Información del calendario"><Info size={18} /></button>
                  </div>
                ))}
              </section>
            ))
          ) : changes.length > 0 ? (
            <div className={styles.changeList}>
              {changes.map((change) => {
                const unread = !change.change_reads || change.change_reads.length === 0
                return (
                  <article key={change.id} className={`${styles.changeRow} ${unread ? styles.unread : ''}`}>
                    <span className={styles.changeIcon} style={{ color: change.calendars?.color || '#5B3DF5' }}><Bell size={18} /></span>
                    <div>
                      <strong>{change.summary}</strong>
                      <small>{formatDistanceToNowStrict(new Date(change.created_at), { addSuffix: true, locale: es })}</small>
                    </div>
                    {unread && <button onClick={() => markRead(change)}>OK</button>}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className={styles.empty}>Todavía no hay cambios compartidos.</div>
          )}
        </div>

        {selectedSource && (
          <div className={styles.detailCard}>
            <button className={styles.detailClose} onClick={() => setSelectedSource(null)}><X size={17} /></button>
            <span className={styles.largeDot} style={{ backgroundColor: selectedSource.calendars?.color || '#5B3DF5' }} />
            <h3>{selectedSource.calendars?.nombre}</h3>
            <p>{selectedSource.can_edit ? 'Tiene permiso para crear y editar eventos.' : 'Este calendario es de solo lectura para su cuenta.'}</p>
            <button onClick={() => setSelectedSource(null)}>Listo <ChevronRight size={16} /></button>
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
