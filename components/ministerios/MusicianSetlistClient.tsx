'use client'

import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Music2, Plus, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { guardarVersionOficialCancionSetlist } from '@/app/actions/setlist-alabanza'

export type MusicianSetlistSong = {
  rowId: string
  songId: string | null
  title: string
  artist: string | null
  serviceTone: string
  baseTone: string
  chords: string
  notes: string
}

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
}

function rootOf(value: string) {
  const match = String(value || '').trim().match(/^([A-G](?:#|b)?)/)
  return match?.[1] || ''
}

function signedDistance(from: string, to: string) {
  if (!(from in NOTE_INDEX) || !(to in NOTE_INDEX)) return 0
  let distance = (NOTE_INDEX[to] - NOTE_INDEX[from] + 12) % 12
  if (distance > 6) distance -= 12
  return distance
}

function transposeRoot(root: string, semitones: number) {
  const index = NOTE_INDEX[root]
  if (index === undefined) return root
  const notes = root.includes('b') ? FLATS : SHARPS
  return notes[(index + semitones + 120) % 12]
}

function transposeToken(token: string, semitones: number) {
  if (!semitones) return token
  const lead = token.match(/^[\[(|]+/)?.[0] || ''
  const tail = token.match(/[\]),;|]+$/)?.[0] || ''
  const core = token.slice(lead.length, token.length - tail.length)
  const match = core.match(/^([A-G](?:#|b)?)(m|maj|min|dim|aug|sus|add|M|ø|°)?([0-9+#()\-b]*)(?:\/([A-G](?:#|b)?))?$/)
  if (!match) return token
  const [, root, quality = '', details = '', bass = ''] = match
  const nextRoot = transposeRoot(root, semitones)
  const nextBass = bass ? `/${transposeRoot(bass, semitones)}` : ''
  return `${lead}${nextRoot}${quality}${details}${nextBass}${tail}`
}

function transposeText(text: string, semitones: number) {
  return text.split(/(\s+)/).map((token) => /^\s+$/.test(token) ? token : transposeToken(token, semitones)).join('')
}

function initialShift(song: MusicianSetlistSong) {
  const base = rootOf(song.baseTone)
  const service = rootOf(song.serviceTone)
  return base && service ? signedDistance(base, service) : 0
}

function currentTone(song: MusicianSetlistSong, semitones: number) {
  const source = rootOf(song.baseTone || song.serviceTone)
  if (!source) return song.serviceTone || song.baseTone || 'Sin tono'
  const suffixSource = song.baseTone || song.serviceTone
  const suffix = suffixSource.slice(source.length)
  return `${transposeRoot(source, semitones)}${suffix}`
}

export default function MusicianSetlistClient({
  ministerioId,
  songs,
  canEditOfficial,
}: {
  ministerioId: string
  songs: MusicianSetlistSong[]
  canEditOfficial: boolean
}) {
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [shift, setShift] = useState(0)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const selected = selectedIndex === null ? null : songs[selectedIndex]
  const displayedChords = useMemo(() => selected ? transposeText(selected.chords, shift) : '', [selected, shift])

  const openSong = (index: number) => {
    setSelectedIndex(index)
    setShift(initialShift(songs[index]))
    setStatus(null)
  }

  const saveOfficial = (song: MusicianSetlistSong, form: HTMLFormElement) => {
    if (!song.songId) return
    const data = new FormData(form)
    setStatus(null)
    startTransition(async () => {
      const result = await guardarVersionOficialCancionSetlist(ministerioId, song.songId!, {
        tonalidadBase: String(data.get('tonalidad_base') || ''),
        acordes: String(data.get('acordes') || ''),
      })
      if (!result.success) return setStatus(result.error || 'No fue posible guardar.')
      setStatus('Versión oficial guardada.')
      router.refresh()
    })
  }

  if (!selected) {
    return (
      <section className="overflow-hidden bg-white">
        {songs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Music2 className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">Todavía no hay canciones en este servicio.</p>
          </div>
        ) : songs.map((song, index) => (
          <button key={song.rowId} type="button" onClick={() => openSong(index)} className="flex min-h-[68px] w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 active:bg-slate-50">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-black text-violet-700">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-slate-900">{song.title}</span>
              <span className="mt-0.5 block truncate text-[11px] text-slate-500">{song.artist || 'Canción del repertorio'}</span>
            </span>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">{song.serviceTone || song.baseTone || '—'}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </button>
        ))}
      </section>
    )
  }

  const serviceShift = initialShift(selected)
  const tone = currentTone(selected, shift)

  return (
    <section className="bg-white text-slate-900">
      <header className="flex min-h-16 items-center gap-2 border-b border-slate-100 px-3">
        <button type="button" onClick={() => setSelectedIndex(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-700 active:bg-slate-100" aria-label="Volver al setlist"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{selected.title}</p><p className="truncate text-[11px] text-slate-500">{selected.artist || `${selectedIndex! + 1} de ${songs.length}`}</p></div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{tone}</span>
      </header>

      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Transposición personal</p><p className="mt-0.5 text-xs text-slate-600">No cambia la versión oficial.</p></div>
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            <button type="button" onClick={() => setShift((value) => value - 1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-sm" aria-label="Bajar medio tono"><Minus className="h-4 w-4" /></button>
            <span className="min-w-12 text-center text-xs font-black text-slate-800">{tone}</span>
            <button type="button" onClick={() => setShift((value) => value + 1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-sm" aria-label="Subir medio tono"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        {shift !== serviceShift ? <button type="button" onClick={() => setShift(serviceShift)} className="mt-2 text-[11px] font-bold text-violet-600">Volver al tono del servicio ({selected.serviceTone || selected.baseTone || 'original'})</button> : null}
      </div>

      <div className="min-h-[42vh] px-4 py-5">
        {displayedChords ? <pre className="whitespace-pre-wrap break-words font-mono text-[15px] leading-7 text-slate-900">{displayedChords}</pre> : <p className="py-10 text-center text-sm text-slate-500">Los acordes oficiales todavía no han sido preparados.</p>}
        {selected.notes ? <div className="mt-6 border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Notas del servicio</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.notes}</p></div> : null}
      </div>

      <div className="grid grid-cols-2 border-y border-slate-100">
        <button type="button" disabled={selectedIndex === 0} onClick={() => openSong(selectedIndex! - 1)} className="flex min-h-12 items-center justify-center gap-2 border-r border-slate-100 text-xs font-bold text-slate-700 disabled:text-slate-300"><ChevronLeft className="h-4 w-4" />Anterior</button>
        <button type="button" disabled={selectedIndex === songs.length - 1} onClick={() => openSong(selectedIndex! + 1)} className="flex min-h-12 items-center justify-center gap-2 text-xs font-bold text-slate-700 disabled:text-slate-300">Siguiente<ChevronRight className="h-4 w-4" /></button>
      </div>

      {canEditOfficial && selected.songId ? (
        <details className="border-b border-slate-100">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-xs font-extrabold text-violet-700 [&::-webkit-details-marker]:hidden">Editar versión oficial <span className="text-slate-400">+</span></summary>
          <form onSubmit={(event) => { event.preventDefault(); saveOfficial(selected, event.currentTarget) }} className="space-y-3 border-t border-slate-100 bg-slate-50 px-4 py-4">
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Tono base</span><input name="tonalidad_base" defaultValue={selected.baseTone} placeholder="Ej. D" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-500" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Acordes oficiales</span><textarea name="acordes" defaultValue={selected.chords} rows={12} maxLength={30000} placeholder={'D   A   Bm   G\n...'} className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 font-mono text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-500" /></label>
            <button disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-extrabold text-white disabled:opacity-50"><Save className="h-4 w-4" />Guardar versión oficial</button>
            {status ? <p className="text-xs font-semibold text-slate-600">{status}</p> : null}
          </form>
        </details>
      ) : null}
    </section>
  )
}
