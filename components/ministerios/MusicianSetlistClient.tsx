'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Music2, Plus, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { reordenarCancionesServicio } from '@/app/actions/repertorio-programacion'
import PantallaCancion from './PantallaCancion'
import { transportarCifrado } from '@/lib/musica/transponer'
import { guardarVersionOficialCancionSetlist } from '@/app/actions/setlist-alabanza'

export type MusicianSetlistSong = { rowId: string; songId: string | null; title: string; artist: string | null; serviceTone: string; baseTone: string; chords: string; lyrics: string; permanentNotes: string; notes: string }
const SHARPS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']; const FLATS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']; const NOTE_INDEX: Record<string, number> = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11 }
function saltosReales(text:string|null){return String(text||'').replace(/\\+n|\/n/g,'\n')} function rootOf(value:string){return String(value||'').trim().match(/^([A-G](?:#|b)?)/)?.[1]||''} function signedDistance(from:string,to:string){if(!(from in NOTE_INDEX)||!(to in NOTE_INDEX))return 0;let d=(NOTE_INDEX[to]-NOTE_INDEX[from]+12)%12;if(d>6)d-=12;return d} function transposeRoot(root:string,s:number){const i=NOTE_INDEX[root];if(i===undefined)return root;const notes=root.includes('b')?FLATS:SHARPS;return notes[(i+s+120)%12]} function transposeText(text:string,s:number){return transportarCifrado(saltosReales(text),s)} function initialShift(song:MusicianSetlistSong){const b=rootOf(song.baseTone),s=rootOf(song.serviceTone);return b&&s?signedDistance(b,s):0} function currentTone(song:MusicianSetlistSong,s:number){const source=rootOf(song.baseTone||song.serviceTone);if(!source)return song.serviceTone||song.baseTone||'Sin tono';const suffixSource=song.baseTone||song.serviceTone;return `${transposeRoot(source,s)}${suffixSource.slice(source.length)}`}

export default function MusicianSetlistClient({ ministerioId, eventoId, songs, canEditOfficial }: { ministerioId:string; eventoId?:string; songs:MusicianSetlistSong[]; canEditOfficial:boolean }) {
  const [grande,setGrande]=useState(false); const cerrarGrande=useCallback(()=>setGrande(false),[]);
  const router=useRouter(); const [selectedIndex,setSelectedIndex]=useState<number|null>(null); const [shift,setShift]=useState(0); const [vista,setVista]=useState<'cifrado'|'letra'>('cifrado'); const [pending,startTransition]=useTransition(); const [status,setStatus]=useState<string|null>(null); const selected=selectedIndex===null?null:songs[selectedIndex]; const displayedChords=useMemo(()=>selected?transposeText(selected.chords,shift):'',[selected,shift]); const openSong=(index:number)=>{const song=songs[index];setSelectedIndex(index);setShift(initialShift(song));setVista(song.chords?'cifrado':'letra');setStatus(null)}; const saveOfficial=(song:MusicianSetlistSong,form:HTMLFormElement)=>{if(!song.songId)return;const data=new FormData(form);setStatus(null);startTransition(async()=>{const result=await guardarVersionOficialCancionSetlist(ministerioId,song.songId!,{tonalidadBase:String(data.get('tonalidad_base')||''),acordes:String(data.get('acordes')||'')});if(!result.success)return setStatus(result.error||'No fue posible guardar.');setStatus('Versión oficial guardada.');router.refresh()})}
  const mover = (index:number, direccion:number) => {
    if (!canEditOfficial || !eventoId || index+direccion<0 || index+direccion>=songs.length) return
    const esperado=songs.map(s=>s.rowId), nuevo=[...esperado]; [nuevo[index],nuevo[index+direccion]]=[nuevo[index+direccion],nuevo[index]]
    startTransition(async()=>{setStatus('Guardando orden…');try{const r=await reordenarCancionesServicio(ministerioId,eventoId,esperado,nuevo);setStatus(r.success?'Orden guardado.':r.error||'No se pudo guardar.');if(r.success)router.refresh()}catch{setStatus('No se pudo confirmar el orden. Actualiza la página antes de reintentar.')}})
  }
  if(!selected)return <section className="overflow-hidden bg-white">{status && <p role="status" className="px-4 py-3 text-sm text-slate-600">{status}</p>}{songs.length===0?<div className="px-5 py-12 text-center">
<Music2 className="mx-auto h-7 w-7 text-slate-300"/>
<p className="mt-3 text-sm font-bold text-slate-700">Todavía no hay canciones en este servicio.</p>
</div>:songs.map((song,index)=>
<div key={song.rowId} className="flex min-w-0 items-center border-b border-slate-100 last:border-0"><button type="button" disabled={pending} onClick={()=>openSong(index)} className="flex min-h-[68px] min-w-0 flex-1 items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 active:bg-slate-50">
<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-xs font-black text-violet-700">{index+1}</span>
<span className="min-w-0 flex-1">
<span className="block truncate text-sm font-extrabold text-slate-900">{song.title}</span>
<span className="mt-0.5 block truncate text-[11px] text-slate-500">{song.artist||'Canción del repertorio'}</span>
</span>
<span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">{song.serviceTone||song.baseTone||'—'}</span>
<ChevronRight className="h-4 w-4 shrink-0 text-slate-300"/>
</button>{canEditOfficial&&eventoId&&<div className="flex shrink-0 flex-col pr-2"><button type="button" aria-label={`Subir ${song.title}`} disabled={pending||index===0} onClick={()=>mover(index,-1)} className="min-h-11 px-3 text-sm font-bold text-violet-700 disabled:opacity-30">↑</button><button type="button" aria-label={`Bajar ${song.title}`} disabled={pending||index===songs.length-1} onClick={()=>mover(index,1)} className="min-h-11 px-3 text-sm font-bold text-violet-700 disabled:opacity-30">↓</button></div>}</div>)}</section>
  const serviceShift=initialShift(selected); const tone=currentTone(selected,shift)
  const contenido = (<div className="min-h-[42vh] px-4 py-5">{vista==='cifrado'?(displayedChords?<pre className="whitespace-pre-wrap break-words font-mono text-base leading-8 sm:text-lg text-slate-900">{displayedChords}</pre>:<p className="py-10 text-center text-sm text-slate-500">El cifrado oficial todavía no ha sido preparado.</p>):(selected.lyrics?<p className="whitespace-pre-wrap text-base leading-8 sm:text-lg text-slate-800">{saltosReales(selected.lyrics)}</p>:<p className="py-10 text-center text-sm text-slate-500">La letra todavía no ha sido preparada.</p>)}{selected.permanentNotes?<div className="mt-6 border-t border-slate-100 pt-4">
<p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Notas de la canción</p>
<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{saltosReales(selected.permanentNotes)}</p>
</div>:null}{selected.notes?<div className="mt-6 border-t border-slate-100 pt-4">
<p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Indicaciones del servicio</p>
<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{saltosReales(selected.notes)}</p>
</div>:null}</div>)
  return <section className="mx-auto w-full min-w-0 max-w-4xl bg-transparent text-slate-900">
<header className="flex min-h-16 items-center gap-2 border-b border-slate-100 px-3">
<button type="button" onClick={()=>setSelectedIndex(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-700 active:bg-slate-100" aria-label="Volver al setlist">
<ArrowLeft className="h-5 w-5"/>
</button>
<div className="min-w-0 flex-1">
<p className="truncate text-sm font-extrabold">{selected.title}</p>
<p className="truncate text-[11px] text-slate-500">{selected.artist||`${selectedIndex!+1} de ${songs.length}`}</p>
</div>
<span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{tone}</span><button type="button" onClick={()=>setGrande(true)} className="min-h-11 px-2 text-xs font-bold text-violet-700">Ver en grande</button>
</header>
<div className="border-b border-slate-100 px-4 py-3">
<div className="flex items-center justify-between gap-3">
<div>
<p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Transposición personal</p>
<p className="mt-0.5 text-xs text-slate-600">No cambia la versión oficial.</p>
</div>
<div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
<button type="button" onClick={()=>setShift((v)=>v-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-sm">
<Minus className="h-4 w-4"/>
</button>
<span className="min-w-12 text-center text-xs font-black text-slate-800">{tone}</span>
<button type="button" onClick={()=>setShift((v)=>v+1)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-sm">
<Plus className="h-4 w-4"/>
</button>
</div>
</div>{shift!==serviceShift?<button type="button" onClick={()=>setShift(serviceShift)} className="mt-2 text-[11px] font-bold text-violet-600">Volver al tono del servicio ({selected.serviceTone||selected.baseTone||'original'})</button>:null}</div>{canEditOfficial && selected.songId ? <div className="border-b border-slate-100 px-4 py-2">
<button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await guardarVersionOficialCancionSetlist(ministerioId, selected.songId!, { tonalidadBase: tone, acordes: displayedChords }); if (!result.success) { setStatus(result.error || 'No fue posible guardar.'); return } setShift(0); setStatus('Tono y acordes guardados en la biblioteca.'); router.refresh() })} className="min-h-11 text-xs font-bold text-violet-700 disabled:opacity-50">Guardar este tono en biblioteca</button>{status ? <p role="status" className="text-xs text-slate-600">{status}</p> : null}</div> : null}<div className="grid grid-cols-2 border-b border-slate-100">
<button type="button" aria-pressed={vista==='cifrado'} onClick={()=>setVista('cifrado')} className={`min-h-11 text-xs font-extrabold ${vista==='cifrado'?'border-b-2 border-violet-600 bg-violet-50 text-violet-800':'border-b-2 border-transparent text-slate-500'}`}>Cifrado</button>
<button type="button" aria-pressed={vista==='letra'} onClick={()=>setVista('letra')} className={`min-h-11 text-xs font-extrabold ${vista==='letra'?'border-b-2 border-violet-600 bg-violet-50 text-violet-800':'border-b-2 border-transparent text-slate-500'}`}>Letra</button>
</div>
{contenido}
<div className="grid grid-cols-2 border-y border-slate-100">
<button type="button" disabled={pending||selectedIndex===0} onClick={()=>openSong(selectedIndex!-1)} className="flex min-h-12 items-center justify-center gap-2 border-r border-slate-100 text-xs font-bold text-slate-700 disabled:text-slate-300">
<ChevronLeft className="h-4 w-4"/>Anterior</button>
<button type="button" disabled={pending||selectedIndex===songs.length-1} onClick={()=>openSong(selectedIndex!+1)} className="flex min-h-12 items-center justify-center gap-2 text-xs font-bold text-slate-700 disabled:text-slate-300">Siguiente<ChevronRight className="h-4 w-4"/>
</button>
</div>{canEditOfficial&&selected.songId?<details key={selected.rowId} className="border-b border-slate-100">
<summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-xs font-extrabold text-violet-700 [&::-webkit-details-marker]:hidden">Editar tono/cifrado oficial <span className="text-slate-400">+</span>
</summary>
<form onSubmit={(event)=>{event.preventDefault();saveOfficial(selected,event.currentTarget)}} className="space-y-3 border-t border-slate-100 px-4 py-4">
<label className="block">
<span className="mb-1.5 block text-xs font-bold text-slate-700">Tono base</span>
<input name="tonalidad_base" defaultValue={selected.baseTone} placeholder="Ej. D" className="h-11 w-full rounded-none border-0 border-b border-slate-200 bg-transparent px-0 text-sm text-slate-900 outline-none placeholder:text-slate-500"/>
</label>
<label className="block">
<span className="mb-1.5 block text-xs font-bold text-slate-700">Cifrado oficial</span>
<textarea name="acordes" defaultValue={saltosReales(selected.chords)} rows={12} maxLength={30000} placeholder={'D   A   Bm   G\n...'} className="w-full resize-y rounded-none border-0 border-b border-slate-200 bg-transparent py-3 font-mono text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-500"/>
</label>
<button disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-extrabold text-white disabled:opacity-50">
<Save className="h-4 w-4"/>Guardar versión oficial</button>{status?<p className="text-xs font-semibold text-slate-600">{status}</p>:null}</form>
</details>:null}{grande && <PantallaCancion pagina={selected.rowId} titulo={`${selected.title} · ${tone}`} cerrar={cerrarGrande}>
<div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">{selected.artist || 'Canción del repertorio'} · {selectedIndex!+1} de {songs.length}</p><div className="flex items-center gap-3"><button type="button" aria-label="Bajar medio tono" onClick={()=>setShift(v=>v-1)} className="min-h-11 px-3 font-bold text-violet-700">− ½</button><strong>{tone}</strong><button type="button" aria-label="Subir medio tono" onClick={()=>setShift(v=>v+1)} className="min-h-11 px-3 font-bold text-violet-700">+ ½</button></div></div>
<div className="flex gap-5 border-b border-slate-200"><button type="button" aria-pressed={vista==='cifrado'} onClick={()=>setVista('cifrado')} className={`min-h-11 text-sm font-bold ${vista==='cifrado'?'border-b-2 border-violet-600 bg-violet-50 text-violet-800':'border-b-2 border-transparent text-slate-500'}`}>Acordes</button><button type="button" aria-pressed={vista==='letra'} onClick={()=>setVista('letra')} className={`min-h-11 text-sm font-bold ${vista==='letra'?'border-b-2 border-violet-600 bg-violet-50 text-violet-800':'border-b-2 border-transparent text-slate-500'}`}>Letra</button></div>
{contenido}
<div className="flex justify-between gap-4 border-t border-slate-200"><button type="button" disabled={pending||selectedIndex===0} onClick={()=>openSong(selectedIndex!-1)} className="min-h-12 text-sm font-bold text-violet-700 disabled:opacity-40">Anterior</button><button type="button" disabled={pending||selectedIndex===songs.length-1} onClick={()=>openSong(selectedIndex!+1)} className="min-h-12 text-sm font-bold text-violet-700 disabled:opacity-40">Siguiente</button></div>
</PantallaCancion>}</section>
}
