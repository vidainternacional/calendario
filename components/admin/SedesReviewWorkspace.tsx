'use client'

import { useEffect, useState } from 'react'
import { REVIEW_PEOPLE, reviewRecipients, type ReviewAudience } from '@/lib/admin/sedes-review'

type Group = { name: string; sender: string; audience: ReviewAudience }
const SEDES = [{ id: 'santa-ana', name: 'Santa Ana', detail: 'Central · El Salvador' }, { id: 'chalchuapa', name: 'Chalchuapa', detail: 'Sede · El Salvador' }]
const ROLES = [{ id: 'pastor', name: 'Pastores' }, { id: 'administrador', name: 'Administradores' }, { id: 'lider', name: 'Líderes' }, { id: 'servidor', name: 'Servidores' }, { id: 'miembro', name: 'Miembros sin ministerio' }]
const toggle = (values: string[], id: string) => values.includes(id) ? values.filter(v => v !== id) : [...values, id]
const initial: ReviewAudience = { sedes: [], roles: [], ministry: '', people: [], all: true }

export default function SedesReviewWorkspace() {
  const [sedes, setSedes] = useState(SEDES)
  const [newSede, setNewSede] = useState('VIDA Guatemala')
  const [view, setView] = useState('santa-ana')
  const [sender, setSender] = useState('administrador')
  const [audience, setAudience] = useState<ReviewAudience>(initial)
  const [title, setTitle] = useState('Estudio bíblico de esta semana')
  const [body, setBody] = useState('Les esperamos para compartir y estudiar juntos.')
  const [groupName, setGroupName] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState('')
  const [file, setFile] = useState<{ url: string; name: string; type: string } | null>(null)
  const allowed = REVIEW_PEOPLE.filter(p => sender === 'administrador' || sender === 'general' || (p.sede === 'santa-ana' && (sender !== 'lider' || p.ministry === 'alabanza'))).map(p => p.id)
  const recipients = reviewRecipients(audience, REVIEW_PEOPLE, allowed)
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url) }, [file])
  const chip = (active: boolean) => `min-h-11 rounded-full px-4 text-sm font-semibold ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`

  return <div className="min-w-0">
    <h1 className="mt-5 text-2xl font-bold">VIDA · Sedes y mensajería</h1>
    <p role="note" className="mt-3 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-amber-900">Vista de revisión con personas de ejemplo. No envía mensajes, no cambia permisos ni guarda asignaciones reales. Los grupos de prueba duran mientras permanezcas en esta pantalla.</p>
    <section className="mt-7 border-b border-slate-200 pb-6">
      <h2 className="text-lg font-semibold">Explorar una sede</h2>
      <div className="mt-3 flex flex-wrap gap-2">{sedes.map(s => <button key={s.id} type="button" aria-pressed={view === s.id} onClick={() => setView(s.id)} className={chip(view === s.id)}>{s.name}</button>)}</div>
      <p className="mt-3 text-sm text-slate-600">{sedes.find(s => s.id === view)?.detail}</p>
      <p className="mt-2 text-sm leading-6">Aviso público de ejemplo: estudio bíblico semanal en {sedes.find(s => s.id === view)?.name}.</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">Visitar otra sede permite ver lo público; no concede acceso a sus ministerios, conversaciones o programación interna. Guatemala se añadirá cuando administración cree esa sede.</p>
      <details className="mt-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Preparar otra sede · prueba de administración</summary>
        <label className="mt-2 block text-sm">Nombre<input value={newSede} maxLength={80} onChange={e => setNewSede(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200" /></label>
        <button type="button" disabled={!newSede.trim() || sedes.length >= 8} className="min-h-11 text-sm font-semibold underline disabled:opacity-40" onClick={() => {
          const id = `ejemplo-${sedes.length}`
          setSedes(s => [...s, { id, name: newSede.trim(), detail: 'Sede propuesta · país, zona horaria y responsables por definir' }]); setView(id); setStatus('Sede de ejemplo preparada. No se creó en la base de datos.')
        }}>Añadir sede de ejemplo</button>
      </details>
    </section>
    <section className="py-6">
      <h2 className="text-lg font-semibold">Preparar un mensaje</h2>
      <label className="mt-4 block text-sm font-semibold">Ver como · ejemplo de responsabilidad
        <select value={sender} onChange={e => { setSender(e.target.value); setPreview(false) }} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200">
          <option value="administrador">Administración general</option><option value="general">Pastor general</option><option value="pastor">Pastor de Santa Ana</option><option value="lider">Líder de Alabanza de Santa Ana</option>
        </select>
      </label>
      <p className="mt-2 text-xs leading-5 text-slate-600">{sender === 'pastor' ? 'Alcance de ejemplo: Santa Ana.' : sender === 'lider' ? 'Alcance de ejemplo: Alabanza de Santa Ana.' : 'Alcance de ejemplo: todas las sedes.'} Los destinatarios fuera de ese alcance quedan excluidos, incluso al cargar un grupo.</p>
      <fieldset className="mt-5"><legend className="text-sm font-semibold">1. Sedes destinatarias</legend>
        <div className="mt-2 flex flex-wrap gap-2"><button type="button" aria-pressed={!audience.sedes.length} className={chip(!audience.sedes.length)} onClick={() => { setAudience(a => ({ ...a, sedes: [] })); setPreview(false) }}>Todas las permitidas</button>{sedes.map(s => <button type="button" key={s.id} aria-pressed={audience.sedes.includes(s.id)} className={chip(audience.sedes.includes(s.id))} onClick={() => { setAudience(a => ({ ...a, sedes: toggle(a.sedes, s.id) })); setPreview(false) }}>{s.name}</button>)}</div>
      </fieldset>
      <fieldset className="mt-5"><legend className="text-sm font-semibold">2. A quiénes</legend>
        <div className="mt-2 flex flex-wrap gap-2"><button type="button" aria-pressed={audience.all} className={chip(audience.all)} onClick={() => { setAudience(a => ({ ...a, all: !a.all })); setPreview(false) }}>Toda la congregación</button>{ROLES.map(r => <button type="button" key={r.id} aria-pressed={audience.roles.includes(r.id)} className={chip(audience.roles.includes(r.id))} onClick={() => { setAudience(a => ({ ...a, all: false, roles: toggle(a.roles, r.id) })); setPreview(false) }}>{r.name}</button>)}</div>
        <label className="mt-3 block text-sm">Ministerio
          <select value={audience.ministry} onChange={e => { setAudience(a => ({ ...a, all: false, ministry: e.target.value })); setPreview(false) }} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200"><option value="">Sin selección adicional</option><option value="alabanza">Alabanza</option></select>
        </label>
      </fieldset>
      <details className="mt-4 border-b border-slate-200 py-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Personas específicas · ejemplos</summary><div className="space-y-2 py-3">{REVIEW_PEOPLE.filter(p => allowed.includes(p.id)).map(p => <label key={p.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={audience.people.includes(p.id)} onChange={() => { setAudience(a => ({ ...a, all: false, people: toggle(a.people, p.id) })); setPreview(false) }} />{p.label}</label>)}</div></details>
      <p role="status" className="mt-4 text-sm font-semibold">{recipients.length} destinatarios de ejemplo · sin duplicados</p>
      <details className="mt-4 border-b border-slate-200 py-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Grupos guardados · prueba</summary>
        <div className="py-3"><label className="block text-sm">Nombre del grupo<input value={groupName} maxLength={70} onChange={e => setGroupName(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200" placeholder="Por ejemplo: Equipo de vigilia" /></label>
          <button type="button" disabled={!groupName.trim() || recipients.length === 0 || groups.length >= 20} className="mt-3 min-h-11 text-sm font-semibold underline disabled:opacity-40" onClick={() => { setGroups(g => [...g, { name: groupName.trim(), sender, audience: { ...audience } }]); setGroupName(''); setStatus('Grupo de prueba guardado en esta pantalla.') }}>Guardar selección como grupo de prueba</button>
          <div className="mt-2 flex flex-wrap gap-2">{groups.filter(g => g.sender === sender).map((g, i) => <button type="button" className={chip(false)} key={i} onClick={() => { setAudience(g.audience); setPreview(false); setStatus(`Selección cargada: ${g.name}`) }}>{g.name}</button>)}</div>
        </div>
      </details>
      <label className="mt-5 block text-sm font-semibold">Título<input value={title} maxLength={150} onChange={e => { setTitle(e.target.value); setPreview(false) }} className="mt-2 min-h-11 w-full rounded-xl bg-white px-3 text-slate-800 ring-1 ring-slate-200" /></label>
      <label className="mt-4 block text-sm font-semibold">Mensaje<textarea value={body} maxLength={5000} onChange={e => { setBody(e.target.value); setPreview(false) }} rows={4} className="mt-2 w-full rounded-xl bg-white p-3 text-slate-800 ring-1 ring-slate-200" /></label>
      <label className="mt-4 block text-sm font-semibold">Adjunto de prueba · PDF o imagen
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm text-slate-700" onChange={e => {
          const chosen = e.target.files?.[0]
          if (!chosen) return
          if (!['application/pdf','image/jpeg','image/png','image/webp'].includes(chosen.type) || chosen.size > 25 * 1024 * 1024) { setStatus('Selecciona un PDF o imagen de hasta 25 MB.'); e.target.value = ''; return }
          setFile({ url: URL.createObjectURL(chosen), name: chosen.name, type: chosen.type }); setPreview(false); setStatus('Adjunto local: no se ha subido a ningún servidor.')
        }} />
      </label>
      {file && <div className="mt-3"><p className="break-words text-sm">{file.name}</p>{file.type === 'application/pdf' ? <iframe title="PDF de prueba" src={file.url} className="mt-2 h-80 w-full" /> : <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm underline">Ver imagen de prueba</a>}<button type="button" onClick={() => setFile(null)} className="ml-3 min-h-11 text-sm underline">Quitar adjunto</button></div>}
      <p className="mt-2 text-xs leading-5 text-slate-500">Este adjunto solo se revisa en tu dispositivo. No se activa R2 ni se guarda en Supabase.</p>
      <button type="button" disabled={!recipients.length || !title.trim() || !body.trim()} className="mt-5 min-h-11 w-full rounded-full bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-40" onClick={() => setPreview(v => !v)}>Revisar destinatarios y mensaje</button>
      <p role="status" className="mt-2 text-sm text-slate-600">{status}</p>
      {preview && <section aria-label="Vista previa del mensaje" className="mt-5 border-t border-slate-200 pt-5"><h3 className="break-words text-lg font-semibold">{title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{body}</p><p className="mt-4 text-sm font-semibold">Destinatarios de ejemplo</p><ul className="mt-2 space-y-2 text-sm">{recipients.map(p => <li key={p.id}>{p.label}</li>)}</ul><p className="mt-4 text-sm text-amber-800">No se ha enviado ningún mensaje ni notificación.</p></section>}
    </section>
    <section className="border-t border-slate-200 py-6"><h2 className="text-lg font-semibold">Biblia y recursos</h2><p className="mt-2 text-sm leading-6">Neon continúa como biblioteca principal. Se prepara reutilización temporal de consultas editoriales iguales para reducir consumo. El Supabase anterior conserva textos verificados; la conmutación automática todavía no está activada. El análisis palabra por palabra sigue en Neon.</p><p className="mt-2 text-sm leading-6">Las cuentas y el progreso continúan en ccvida. No se crean usuarios ni sedes reales desde esta revisión.</p></section>
  </div>
}
