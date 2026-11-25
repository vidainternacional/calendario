'use client'

import { useEffect, useState } from 'react'
import { REVIEW_PEOPLE, reviewRecipients, type ReviewAudience } from '@/lib/admin/sedes-review'

type Group = { name: string; sender: string; audience: ReviewAudience }
const SEDES = [{ id: 'santa-ana', name: 'Santa Ana', detail: 'Central · El Salvador' }, { id: 'chalchuapa', name: 'Chalchuapa', detail: 'Sede · El Salvador' }]
const ROLES = [{ id: 'pastor', name: 'Pastores' }, { id: 'administrador', name: 'Administradores' }, { id: 'lider', name: 'Líderes' }, { id: 'servidor', name: 'Servidores' }, { id: 'miembro', name: 'Miembros sin ministerio' }]
const toggle = (values: string[], id: string) => values.includes(id) ? values.filter(v => v !== id) : [...values, id]
const initial: ReviewAudience = { sedes: [], roles: [], ministries: [], people: [], all: true }

export default function SedesReviewWorkspace() {
  const [sedes, setSedes] = useState(SEDES)
  const [newSede, setNewSede] = useState('VIDA Guatemala')
  const [activeSedes, setActiveSedes] = useState(['santa-ana'])
  const [screen, setScreen] = useState<'inicio' | 'mensaje'>('inicio')
  const [sender, setSender] = useState('administrador')
  const [audience, setAudience] = useState<ReviewAudience>(initial)
  const [title, setTitle] = useState('Estudio bíblico de esta semana')
  const [body, setBody] = useState('Les esperamos para compartir y estudiar juntos.')
  const [groupName, setGroupName] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState('')
  const [file, setFile] = useState<{ url: string; name: string; type: string } | null>(null)
  const allowed = REVIEW_PEOPLE.filter(p => sender === 'administrador' || sender === 'general' || (p.sede === 'santa-ana' && (sender !== 'lider' || p.ministry === 'sa-alabanza'))).map(p => p.id)
  const recipients = reviewRecipients(audience, REVIEW_PEOPLE, allowed)
  const selectedSedeNames = audience.sedes.length ? sedes.filter(s => audience.sedes.includes(s.id)).map(s => s.name).join(' y ') : 'Todas las sedes permitidas'
  const selectedAudienceNames = audience.all ? 'Toda la congregación' : [...ROLES.filter(r => audience.roles.includes(r.id)).map(r => r.name), ...audience.ministries.map(id => id === 'sa-alabanza' ? 'Alabanza · Santa Ana' : 'Alabanza · Chalchuapa'), ...(audience.people.length ? [`${audience.people.length} personas seleccionadas`] : [])].join(' · ') || 'Sin destinatarios seleccionados'
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url) }, [file])
  const chip = (active: boolean) => `min-h-11 rounded-full px-4 text-sm font-semibold ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`

  return <div className="min-w-0">
    <h1 className="mt-5 text-2xl font-bold">VIDA · Sedes y mensajería</h1>
    <p role="note" className="mt-3 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-amber-900">Vista de revisión con personas de ejemplo. No envía mensajes, no cambia permisos ni guarda asignaciones reales. Los grupos de prueba duran mientras permanezcas en esta pantalla.</p>
    <nav aria-label="Vistas de revisión" className="mt-5 flex gap-2"><button type="button" aria-pressed={screen === 'inicio'} className={chip(screen === 'inicio')} onClick={() => setScreen('inicio')}>Inicio · sedes</button><button type="button" aria-pressed={screen === 'mensaje'} className={chip(screen === 'mensaje')} onClick={() => setScreen('mensaje')}>Nuevo mensaje</button></nav>
    {screen === 'inicio' && <section className="mt-7 border-b border-slate-200 pb-6">
      <h2 className="text-lg font-semibold">Qué sedes quieres ver</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Activa Santa Ana, Chalchuapa o ambas. Aquí se muestran sus publicaciones públicas.</p>
      <div className="mt-3 flex flex-wrap gap-2">{sedes.map(s => <button key={s.id} type="button" aria-pressed={activeSedes.includes(s.id)} onClick={() => setActiveSedes(a => toggle(a, s.id))} className={chip(activeSedes.includes(s.id))}>{s.name}</button>)}</div>
      <div className="mt-5 divide-y divide-slate-200">{sedes.filter(s => activeSedes.includes(s.id)).map(s => <article key={s.id} className="py-4">
        <p className="text-xs font-semibold text-slate-500">{s.name} · {s.detail}</p>
        <h3 className="mt-2 text-base font-semibold">Estudio bíblico semanal · ejemplo</h3>
        <p className="mt-2 text-sm leading-6">Te esperamos en {s.name} para compartir y estudiar juntos.</p>
        <p className="mt-3 text-sm font-semibold">Ministerios de {s.name}</p>
        <p className="mt-1 text-sm text-slate-600">Alabanza · presentación pública de ejemplo.</p>
      </article>)}</div>
      {!activeSedes.length && <p role="status" className="mt-4 text-sm">Activa al menos una sede para ver sus publicaciones.</p>}
      <p className="mt-3 text-xs leading-5 text-slate-500">Cada ministerio pertenece a su sede. Ver su presentación pública no te convierte en integrante ni abre sus chats o programación privada. Tu pertenencia sigue siendo independiente de este filtro.</p>
      <details className="mt-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Preparar otra sede · prueba de administración</summary>
        <label className="mt-2 block text-sm">Nombre<input value={newSede} maxLength={80} onChange={e => setNewSede(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200" /></label>
        <button type="button" disabled={!newSede.trim() || sedes.length >= 8} className="min-h-11 text-sm font-semibold underline disabled:opacity-40" onClick={() => {
          const id = `ejemplo-${sedes.length}`
          setSedes(s => [...s, { id, name: newSede.trim(), detail: 'Sede propuesta · país, zona horaria y responsables por definir' }]); setActiveSedes([id]); setStatus('Sede de ejemplo preparada. No se creó en la base de datos.')
        }}>Añadir sede de ejemplo</button>
      </details>
    </section>}
    {screen === 'mensaje' && <section className="py-6">
      <h2 className="text-lg font-semibold">Preparar un mensaje</h2>
      <label className="mt-5 block text-sm font-semibold">Asunto<input value={title} maxLength={150} onChange={e => { setTitle(e.target.value); setPreview(false) }} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200" /></label>
      <label className="mt-4 block text-sm font-semibold">Mensaje<textarea value={body} maxLength={5000} onChange={e => { setBody(e.target.value); setPreview(false) }} rows={4} className="mt-2 w-full rounded-xl bg-white p-3 text-slate-800 ring-1 ring-slate-200" /></label>
      <label className="mt-4 block text-sm font-semibold">Adjunto de prueba · PDF o imagen
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm text-slate-700" onChange={e => {
          const chosen = e.target.files?.[0]
          if (!chosen) return
          if (!['application/pdf','image/jpeg','image/png','image/webp'].includes(chosen.type) || chosen.size > 25 * 1024 * 1024) { setStatus('Selecciona un PDF o imagen de hasta 25 MB.'); e.target.value = ''; return }
          setFile({ url: URL.createObjectURL(chosen), name: chosen.name, type: chosen.type }); setPreview(false); setStatus('Adjunto local: no se ha subido a ningún servidor.'); e.target.value = ''
        }} />
      </label>
      {file && <div className="mt-3"><p className="break-words text-sm">{file.name}</p>{file.type === 'application/pdf' ? <iframe title="PDF de prueba" src={file.url} className="mt-2 h-80 w-full" /> : <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm underline">Ver imagen de prueba</a>}<button type="button" onClick={() => setFile(null)} className="ml-3 min-h-11 text-sm underline">Quitar adjunto</button></div>}
      <p className="mt-2 text-xs leading-5 text-slate-500">Este adjunto solo se revisa en tu dispositivo. No se activa R2 ni se guarda en Supabase.</p>
      <details className="mt-5 border-y border-slate-200 py-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Destinatarios · {recipients.length} de ejemplo<span className="mt-1 block text-xs font-normal leading-5 text-slate-600">{selectedSedeNames} · {selectedAudienceNames}</span></summary>
      <fieldset className="mt-5"><legend className="text-sm font-semibold">1. Sedes destinatarias</legend>
        <div className="mt-2 flex flex-wrap gap-2"><button type="button" aria-pressed={!audience.sedes.length} className={chip(!audience.sedes.length)} onClick={() => { setAudience(a => ({ ...a, sedes: [] })); setPreview(false) }}>Todas las permitidas</button>{sedes.map(s => <button type="button" key={s.id} aria-pressed={audience.sedes.includes(s.id)} className={chip(audience.sedes.includes(s.id))} onClick={() => { setAudience(a => ({ ...a, sedes: toggle(a.sedes, s.id) })); setPreview(false) }}>{s.name}</button>)}</div>
      </fieldset>
      <fieldset className="mt-5"><legend className="text-sm font-semibold">2. A quiénes</legend>
        <div className="mt-2 flex flex-wrap gap-2"><button type="button" aria-pressed={audience.all} className={chip(audience.all)} onClick={() => { setAudience(a => ({ ...a, all: !a.all })); setPreview(false) }}>Toda la congregación</button>{ROLES.map(r => <button type="button" key={r.id} aria-pressed={audience.roles.includes(r.id)} className={chip(audience.roles.includes(r.id))} onClick={() => { setAudience(a => ({ ...a, all: false, roles: toggle(a.roles, r.id) })); setPreview(false) }}>{r.name}</button>)}</div>
        <fieldset className="mt-4"><legend className="text-sm font-semibold">Ministerios de cada sede</legend>
          <div className="mt-2 flex flex-wrap gap-2">{[{ id: 'sa-alabanza', name: 'Alabanza · Santa Ana' }, { id: 'ch-alabanza', name: 'Alabanza · Chalchuapa' }].map(m => <button key={m.id} type="button" aria-pressed={audience.ministries.includes(m.id)} className={chip(audience.ministries.includes(m.id))} onClick={() => { setAudience(a => ({ ...a, all: false, ministries: toggle(a.ministries, m.id) })); setPreview(false) }}>{m.name}</button>)}</div>
        </fieldset>
      </fieldset>
      <details className="mt-4 border-b border-slate-200 py-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Personas específicas · ejemplos</summary><div className="space-y-2 py-3">{REVIEW_PEOPLE.filter(p => allowed.includes(p.id)).map(p => <label key={p.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={audience.people.includes(p.id)} onChange={() => { setAudience(a => ({ ...a, all: false, people: toggle(a.people, p.id) })); setPreview(false) }} />{p.label}</label>)}</div></details>
      <p role="status" className="mt-4 text-sm font-semibold">{recipients.length} destinatarios de ejemplo · sin duplicados</p>
      </details>
      <details className="mt-4 border-b border-slate-200 py-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Grupos guardados · prueba</summary>
        <div className="py-3"><label className="block text-sm">Nombre del grupo<input value={groupName} maxLength={70} onChange={e => setGroupName(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200" placeholder="Por ejemplo: Equipo de vigilia" /></label>
          <button type="button" disabled={!groupName.trim() || recipients.length === 0 || groups.length >= 20} className="mt-3 min-h-11 text-sm font-semibold underline disabled:opacity-40" onClick={() => { setGroups(g => [...g, { name: groupName.trim(), sender, audience: { ...audience } }]); setGroupName(''); setStatus('Grupo de prueba guardado en esta pantalla.') }}>Guardar selección como grupo de prueba</button>
          <div className="mt-2 flex flex-wrap gap-2">{groups.filter(g => g.sender === sender).map((g, i) => <button type="button" className={chip(false)} key={i} onClick={() => { setAudience(g.audience); setPreview(false); setStatus(`Selección cargada: ${g.name}`) }}>{g.name}</button>)}</div>
        </div>
      </details>
      <details className="mt-5 border-t border-slate-200 py-3"><summary className="min-h-11 cursor-pointer text-xs font-semibold text-slate-500">Comprobar permisos · solo en esta demostración</summary>
      <label className="mt-4 block text-sm font-semibold">Ver como · ejemplo de responsabilidad
        <select value={sender} onChange={e => { setSender(e.target.value); setPreview(false) }} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200">
          <option value="administrador">Administración general</option><option value="general">Pastor general</option><option value="pastor">Pastor de Santa Ana</option><option value="lider">Líder de Alabanza de Santa Ana</option>
        </select>
      </label>
      <p className="mt-2 text-xs leading-5 text-slate-600">{sender === 'pastor' ? 'Alcance de ejemplo: Santa Ana.' : sender === 'lider' ? 'Alcance de ejemplo: Alabanza de Santa Ana.' : 'Alcance de ejemplo: todas las sedes.'} Los destinatarios fuera de ese alcance quedan excluidos, incluso al cargar un grupo.</p>
      </details>
      <button type="button" disabled={!recipients.length || !title.trim() || !body.trim()} className="mt-5 min-h-11 w-full rounded-full bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-40" onClick={() => setPreview(v => !v)}>Revisar destinatarios y mensaje</button>
      <p role="status" className="mt-2 text-sm text-slate-600">{status}</p>
      {preview && <section aria-label="Vista previa del mensaje" className="mt-5 border-t border-slate-200 pt-5"><h3 className="break-words text-lg font-semibold">{title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{body}</p><p className="mt-4 text-sm font-semibold">Destinatarios de ejemplo</p><ul className="mt-2 space-y-2 text-sm">{recipients.map(p => <li key={p.id}>{p.label}</li>)}</ul><p className="mt-4 text-sm text-amber-800">No se ha enviado ningún mensaje ni notificación.</p></section>}
    </section>}
    <details className="border-t border-slate-200 py-6"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Estado de Biblia y recursos · revisión</summary><p className="mt-2 text-sm leading-6">Neon continúa como biblioteca principal. Se prepara reutilización temporal de consultas editoriales iguales para reducir consumo. El Supabase anterior conserva textos verificados; la conmutación automática todavía no está activada. El análisis palabra por palabra sigue en Neon.</p><p className="mt-2 text-sm leading-6">Las cuentas y el progreso continúan en ccvida. No se crean usuarios ni sedes reales desde esta revisión.</p></details>
  </div>
}
