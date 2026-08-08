'use client'

import { formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, Info, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import type { EventoCalendario } from './calendario-ios-types'
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
  event_id?: string | null
  summary: string
  change_type: 'created' | 'updated' | 'deleted'
  created_at: string
  calendar_id: string
  calendars: { nombre: string; color: string } | null
  changed_by_profile?: { nombre_completo: string; avatar_url?: string | null } | null
  change_reads?: Array<{ read_at: string }> | null
}

type AccessPerson = {
  id: string
  name: string
  avatar_url?: string | null
  can_edit?: boolean
}

type CalendarAccessDetails = {
  owner: AccessPerson | null
  members: AccessPerson[]
}

type CalendarGroupKey = 'vida' | 'pastoral' | 'ministerios' | 'gmail' | 'icloud' | 'otros'

const GROUP_LABELS: Record<CalendarGroupKey, string> = {
  vida: 'Vida Internacional',
  pastoral: 'Pastoral',
  ministerios: 'Ministerios',
  gmail: 'Gmail',
  icloud: 'iCloud',
  otros: 'Otros',
}

const GROUP_ORDER: CalendarGroupKey[] = ['vida', 'pastoral', 'ministerios', 'gmail', 'icloud', 'otros']

function groupForSource(source: CalendarSource): CalendarGroupKey {
  const calendar = source.calendars
  if (!calendar) return 'otros'

  if (calendar.tipo_cuenta === 'gmail') return 'gmail'
  if (calendar.tipo_cuenta === 'icloud') return 'icloud'
  if (calendar.tipo_cuenta === 'other') return 'otros'

  if (calendar.ministerio_id) return 'ministerios'
  if (calendar.es_publico) return 'vida'
  return 'pastoral'
}

function initials(name?: string | null) {
  return String(name || 'VI')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'VI'
}

function titleFromSummary(summary: string) {
  return summary.match(/[“\"]([^”\"]+)[”\"]/u)?.[1]?.trim() || ''
}

export default function CalendarioSourcesPanel({
  isOpen,
  onClose,
  userId,
  items,
  onOpenItem,
  onVisibilityChanged,
}: {
  isOpen: boolean
  onClose: () => void
  userId: string
  items: EventoCalendario[]
  onOpenItem: (item: EventoCalendario) => void
  onVisibilityChanged: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [sources, setSources] = useState<CalendarSource[]>([])
  const [changes, setChanges] = useState<CalendarChange[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<CalendarSource | null>(null)
  const [accessDetails, setAccessDetails] = useState<CalendarAccessDetails | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [tab, setTab] = useState<'calendars' | 'changes'>('calendars')
  const [error, setError] = useState('')
  const [itemNotice, setItemNotice] = useState('')

  useEffect(() => setMounted(true), [])

  const closeDetails = useCallback(() => {
    setSelectedSource(null)
    setAccessDetails(null)
    setDetailLoading(false)
  }, [])

  const closePanel = useCallback(() => {
    closeDetails()
    setItemNotice('')
    onClose()
  }, [closeDetails, onClose])

  const load = useCallback(async () => {
    if (!isOpen) return
    setLoading(true)
    setError('')
    setItemNotice('')
    const db = createClient() as any

    const [subscriptionsResult, changesResult] = await Promise.all([
      db
        .from('calendar_subscriptions')
        .select('calendar_id, visible, can_edit, calendars(id, nombre, color, tipo_cuenta, es_publico, ministerio_id)')
        .eq('user_id', userId)
        .order('created_at'),
      db
        .from('calendar_changes')
        .select(`
          id,
          event_id,
          summary,
          change_type,
          created_at,
          calendar_id,
          calendars(nombre, color),
          changed_by_profile:profiles!calendar_changes_changed_by_fkey(nombre_completo, avatar_url),
          change_reads!left(read_at)
        `)
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (selectedSource) closeDetails()
      else closePanel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeDetails, closePanel, isOpen, selectedSource])

  const groups = useMemo(() => {
    const map = new Map<CalendarGroupKey, CalendarSource[]>()

    for (const source of sources) {
      const key = groupForSource(source)
      map.set(key, [...(map.get(key) || []), source])
    }

    return GROUP_ORDER
      .map((key) => [key, [...(map.get(key) || [])].sort((a, b) => (
        (a.calendars?.nombre || '').localeCompare(b.calendars?.nombre || '', 'es', { sensitivity: 'base' })
      ))] as const)
      .filter(([, groupItems]) => groupItems.length > 0)
  }, [sources])

  const unreadCount = changes.filter((change) => !change.change_reads || change.change_reads.length === 0).length
  const visibleCount = sources.filter((source) => source.visible).length

  async function toggleVisibility(source: CalendarSource) {
    setSavingId(source.calendar_id)
    setError('')
    const db = createClient() as any
    const next = !source.visible
    const { error: updateError } = await db.rpc('set_calendar_visibility', {
      p_calendar_id: source.calendar_id,
      p_visible: next,
    })

    if (updateError) {
      console.error('[CalendarioSourcesPanel] visibility', updateError)
      setError('No fue posible cambiar la visibilidad.')
    } else {
      setSources((current) => current.map((item) => (
        item.calendar_id === source.calendar_id ? { ...item, visible: next } : item
      )))
      onVisibilityChanged()
    }
    setSavingId(null)
  }

  async function openDetails(source: CalendarSource) {
    setSelectedSource(source)
    setAccessDetails(null)
    setDetailLoading(true)
    const db = createClient() as any
    const { data, error: detailsError } = await db.rpc('get_calendar_access_details', {
      p_calendar_id: source.calendar_id,
    })

    if (detailsError) {
      console.error('[CalendarioSourcesPanel] details', detailsError)
      setError('No fue posible cargar los detalles del calendario.')
    } else {
      const raw = data || {}
      setAccessDetails({
        owner: raw.owner || null,
        members: Array.isArray(raw.members) ? raw.members : [],
      })
    }
    setDetailLoading(false)
  }

  async function markRead(change: CalendarChange) {
    const db = createClient() as any
    const { error: readError } = await db
      .from('change_reads')
      .upsert({ user_id: userId, change_id: change.id }, { onConflict: 'user_id,change_id' })

    if (!readError) {
      setChanges((current) => current.map((item) => (
        item.id === change.id
          ? { ...item, change_reads: [{ read_at: new Date().toISOString() }] }
          : item
      )))
    }
  }

  function resolveChangeItem(change: CalendarChange) {
    if (change.event_id) {
      const event = items.find((item) => item.kind === 'event' && item.id === change.event_id)
      if (event) return event
    }

    const title = titleFromSummary(change.summary)
    if (!title) return null

    return items.find(
      (item) => item.calendar_id === change.calendar_id && item.titulo.trim() === title,
    ) || null
  }

  function openChange(change: CalendarChange) {
    const item = resolveChangeItem(change)
    if (!item) {
      setItemNotice(
        change.change_type === 'deleted'
          ? 'Este elemento fue eliminado y ya no tiene una ficha disponible.'
          : 'El elemento relacionado no está dentro del rango cargado actualmente.',
      )
      return
    }

    if (!change.change_reads || change.change_reads.length === 0) {
      void markRead(change)
    }
    onOpenItem(item)
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-sources-title"
      onMouseDown={(event) => event.target === event.currentTarget && closePanel()}
    >
      <section className={styles.sheet}>
        <span className={styles.grabber} aria-hidden="true" />

        <header className={styles.header}>
          <span className={styles.headerSpacer} aria-hidden="true" />
          <h2 id="calendar-sources-title">Calendarios</h2>
          <button type="button" className={styles.doneButton} onClick={closePanel}>Listo</button>
        </header>

        <p className={styles.intro}>
          {sources.length > 0
            ? `${visibleCount} de ${sources.length} visibles · combina los calendarios que quieres ver`
            : 'Elige los calendarios que aparecerán juntos en todas tus vistas.'}
        </p>

        <div className={styles.tabs} role="tablist" aria-label="Contenido del panel">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'calendars'}
            className={tab === 'calendars' ? styles.tabActive : ''}
            onClick={() => {
              setTab('calendars')
              setItemNotice('')
            }}
          >
            Calendarios
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'changes'}
            className={tab === 'changes' ? styles.tabActive : ''}
            onClick={() => {
              setTab('changes')
              setItemNotice('')
            }}
          >
            Actividad {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        </div>

        {itemNotice && <p className={styles.notice} role="status">{itemNotice}</p>}

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loading} role="status">
              <Loader2 size={22} className="animate-spin" aria-hidden="true" />
              Cargando calendarios…
            </div>
          ) : error ? (
            <p className={styles.error} role="alert">{error}</p>
          ) : tab === 'calendars' ? (
            groups.length > 0 ? groups.map(([group, groupItems]) => (
              <section key={group} className={styles.group}>
                <h3>{GROUP_LABELS[group]}</h3>
                {groupItems.map((source) => {
                  const sourceName = source.calendars?.nombre || 'Calendario'
                  const sourceColor = source.calendars?.color || '#5B3DF5'
                  const saving = savingId === source.calendar_id

                  return (
                    <div key={source.calendar_id} className={styles.sourceRow}>
                      <button
                        type="button"
                        className={styles.visibility}
                        onClick={() => toggleVisibility(source)}
                        disabled={saving}
                        aria-pressed={source.visible}
                        aria-label={`${source.visible ? 'Ocultar' : 'Mostrar'} ${sourceName} en mis vistas`}
                      >
                        <span
                          className={`${styles.colorDot} ${!source.visible ? styles.colorDotHidden : ''}`}
                          style={{ backgroundColor: sourceColor }}
                          aria-hidden="true"
                        >
                          {saving
                            ? <Loader2 size={13} className="animate-spin" />
                            : source.visible && <Check size={14} />}
                        </span>
                        <span className={styles.sourceText}>
                          <strong>{sourceName}</strong>
                          <small>
                            {source.visible ? 'Visible en tu calendario' : 'Oculto en tu calendario'}
                            {source.can_edit ? ' · Puedes editar' : ''}
                          </small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.infoButton}
                        onClick={() => openDetails(source)}
                        aria-label={`Información de ${sourceName}`}
                      >
                        <Info size={20} aria-hidden="true" />
                      </button>
                    </div>
                  )
                })}
              </section>
            )) : (
              <div className={styles.empty}>No hay calendarios disponibles para esta cuenta.</div>
            )
          ) : changes.length > 0 ? (
            <div className={styles.changeList}>
              {changes.map((change) => {
                const unread = !change.change_reads || change.change_reads.length === 0
                const actor = change.changed_by_profile?.nombre_completo || 'Vida Internacional'
                return (
                  <article
                    key={change.id}
                    className={`${styles.changeRow} ${unread ? styles.unread : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openChange(change)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openChange(change)
                      }
                    }}
                    aria-label={`Abrir cambio: ${change.summary}`}
                  >
                    <span
                      className={styles.avatar}
                      style={{ backgroundColor: change.calendars?.color || '#5B3DF5' }}
                      aria-hidden="true"
                    >
                      {initials(actor)}
                    </span>
                    <div className={styles.changeCopy}>
                      <strong>{change.summary}</strong>
                      <small>
                        {actor} · {formatDistanceToNowStrict(new Date(change.created_at), { addSuffix: true, locale: es })}
                      </small>
                    </div>
                    {unread && (
                      <button
                        type="button"
                        className={styles.readButton}
                        onClick={(event) => {
                          event.stopPropagation()
                          void markRead(change)
                        }}
                      >
                        Leído
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className={styles.empty}>Todavía no hay actividad compartida.</div>
          )}
        </div>

        {selectedSource && (
          <div
            className={styles.detailBackdrop}
            onMouseDown={(event) => event.target === event.currentTarget && closeDetails()}
          >
            <section
              className={styles.detailCard}
              role="dialog"
              aria-modal="true"
              aria-labelledby="calendar-detail-title"
            >
              <header className={styles.detailHeader}>
                <span aria-hidden="true" />
                <h3 id="calendar-detail-title">Información</h3>
                <button type="button" className={styles.detailClose} onClick={closeDetails}>Listo</button>
              </header>

              <div className={styles.detailBody}>
                <div className={styles.detailSummary}>
                  <span
                    className={styles.largeDot}
                    style={{ backgroundColor: selectedSource.calendars?.color || '#5B3DF5' }}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{selectedSource.calendars?.nombre || 'Calendario'}</strong>
                    <p>
                      {selectedSource.can_edit
                        ? 'Puede crear y editar eventos y recordatorios.'
                        : 'Este calendario es de solo lectura para su cuenta.'}
                    </p>
                  </div>
                </div>

                {detailLoading ? (
                  <div className={styles.loading} role="status">
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                    Cargando acceso…
                  </div>
                ) : accessDetails ? (
                  <>
                    <section className={styles.accessSection}>
                      <h4>Propietario</h4>
                      {accessDetails.owner ? (
                        <div className={styles.accessPerson}>
                          <span className={styles.accessAvatar} aria-hidden="true">
                            {initials(accessDetails.owner.name)}
                          </span>
                          <strong>{accessDetails.owner.name}</strong>
                          <small>Propietario</small>
                        </div>
                      ) : (
                        <p className={styles.accessEmpty}>Sin propietario asignado.</p>
                      )}
                    </section>

                    <section className={styles.accessSection}>
                      <h4>Personas con acceso</h4>
                      {accessDetails.members.length > 0 ? accessDetails.members.map((member) => (
                        <div key={member.id} className={styles.accessPerson}>
                          <span className={styles.accessAvatar} aria-hidden="true">
                            {initials(member.name)}
                          </span>
                          <strong>{member.name}</strong>
                          <small>{member.can_edit ? 'Puede editar' : 'Solo lectura'}</small>
                        </div>
                      )) : (
                        <p className={styles.accessEmpty}>No hay otras personas con acceso.</p>
                      )}
                    </section>
                  </>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
