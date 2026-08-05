'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Info, Loader2, X } from 'lucide-react'
import { formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import type { EventoCalendario } from './calendario-ios-types'
import styles from './CalendarioSourcesPanel.module.css'
import native from './CalendarioNativeUX.module.css'

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

const GROUP_LABELS: Record<string, string> = {
  interno: 'Vida Internacional',
  gmail: 'Gmail',
  icloud: 'iCloud',
  other: 'Otros',
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
  return summary.match(/[“"]([^”"]+)[”"]/u)?.[1]?.trim() || ''
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
      setSources((current) => current.map((item) => item.calendar_id === source.calendar_id ? { ...item, visible: next } : item))
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
      setChanges((current) => current.map((item) => item.id === change.id ? { ...item, change_reads: [{ read_at: new Date().toISOString() }] } : item))
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
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="calendar-sources-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.sheet}>
        <header className={styles.header}>
          <div>
            <h2 id="calendar-sources-title">Calendarios</h2>
            <p>Elige qué fuentes aparecen en todas las vistas.</p>
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </header>

        <div className={styles.tabs}>
          <button className={tab === 'calendars' ? styles.tabActive : ''} onClick={() => setTab('calendars')}>Calendarios</button>
          <button className={tab === 'changes' ? styles.tabActive : ''} onClick={() => setTab('changes')}>
            Cambios {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        </div>

        {itemNotice && <p className={native.feedUnavailable}>{itemNotice}</p>}

        <div className={styles.body}>
          {loading ? (
            <div className={styles.loading}><Loader2 size={22} className="animate-spin" /> Cargando…</div>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : tab === 'calendars' ? (
            groups.map(([group, groupItems]) => (
              <section key={group} className={styles.group}>
                <h3>{GROUP_LABELS[group] || group}</h3>
                {groupItems.map((source) => (
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
                    <button className={styles.infoButton} onClick={() => openDetails(source)} aria-label="Información del calendario"><Info size={18} /></button>
                  </div>
                ))}
              </section>
            ))
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
                      if (event.key === 'Enter' || event.key === ' ') openChange(change)
                    }}
                    aria-label={`Abrir cambio: ${change.summary}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: change.calendars?.color || '#5B3DF5' }}>
                      {initials(actor)}
                    </span>
                    <div>
                      <strong>{change.summary}</strong>
                      <small>{actor} · {formatDistanceToNowStrict(new Date(change.created_at), { addSuffix: true, locale: es })}</small>
                    </div>
                    {unread && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          void markRead(change)
                        }}
                      >
                        OK
                      </button>
                    )}
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
            <button className={styles.detailClose} onClick={() => { setSelectedSource(null); setAccessDetails(null) }} aria-label="Cerrar detalles"><X size={17} /></button>
            <span className={styles.largeDot} style={{ backgroundColor: selectedSource.calendars?.color || '#5B3DF5' }} />
            <h3>{selectedSource.calendars?.nombre}</h3>
            <p>{selectedSource.can_edit ? 'Puede crear y editar eventos y recordatorios.' : 'Este calendario es de solo lectura para su cuenta.'}</p>

            {detailLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500"><Loader2 size={17} className="animate-spin" /> Cargando acceso…</div>
            ) : accessDetails ? (
              <div className="mt-4 space-y-4 text-left">
                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Propietario</h4>
                  {accessDetails.owner ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">{initials(accessDetails.owner.name)}</span>
                      <div><strong className="block text-sm text-slate-900">{accessDetails.owner.name}</strong><small className="text-slate-500">Propietario del calendario</small></div>
                    </div>
                  ) : <p className="text-sm text-slate-500">Sin propietario asignado.</p>}
                </section>

                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Personas con acceso</h4>
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {accessDetails.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{initials(member.name)}</span>
                        <strong className="min-w-0 flex-1 truncate text-sm text-slate-800">{member.name}</strong>
                        <small className="text-xs text-slate-500">{member.can_edit ? 'Edita' : 'Lee'}</small>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
