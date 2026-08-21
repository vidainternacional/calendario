'use client'

import { type FormEvent, type TouchEvent, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, List, Rows3, Search } from 'lucide-react'
import { HEBREW_LEARNING_GROUPS, type HebrewLearningGroupId } from '@/lib/hebreo/word-learning'

type ReadingMode = 'nikud' | 'plain'
type WordView = 'cards' | 'list' | 'detail'

type CatalogWord = {
  lexicalId: string
  lemma: string
  spanish: string | null
  pronunciation: string | null
  meaningNoteEs: string | null
}

type CatalogResponse = {
  status: 'ok' | 'sin-sesion' | 'no-disponible'
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string
  group: HebrewLearningGroupId
  items: CatalogWord[]
}

type DictionaryResponse = {
  status: 'ok'
  query: string
  total: number
  items: CatalogWord[]
}

const PAGE_SIZE = 24
const EMPTY_RESULT: CatalogResponse = {
  status: 'ok', page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0,
  search: '', group: 'essentials', items: [],
}
const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g
const HEBREW_LETTER = /[\u05D0-\u05EA]/
const LETTER_NAMES: Record<string,string> = { א:'Alef',ב:'Bet',ג:'Guímel',ד:'Dálet',ה:'He',ו:'Vav',ז:'Zayin',ח:'Jet',ט:'Tet',י:'Yod',כ:'Kaf',ך:'Kaf final',ל:'Lamed',מ:'Mem',ם:'Mem final',נ:'Nun',ן:'Nun final',ס:'Sámej',ע:'Ayin',פ:'Pe',ף:'Pe final',צ:'Tsadi',ץ:'Tsadi final',ק:'Qof',ר:'Resh',ש:'Shin / Sin',ת:'Tav' }
const MARK_NAMES: Record<string,string> = {'\u05B0':'Sheva','\u05B1':'Hataf Segol','\u05B2':'Hataf Pataj','\u05B3':'Hataf Qamats','\u05B4':'Hiriq','\u05B5':'Tsere','\u05B6':'Segol','\u05B7':'Pataj','\u05B8':'Qamats','\u05B9':'Holam','\u05BB':'Qubuts','\u05BC':'Dagesh','\u05C1':'punto de Shin','\u05C2':'punto de Sin','\u05C7':'Qamats qatan'}

function withoutNiqqud(value:string){return value.normalize('NFD').replace(HEBREW_MARKS,'').normalize('NFC')}
function formationParts(value:string){const parts:string[]=[];for(const char of Array.from(value.normalize('NFD'))){if(LETTER_NAMES[char])parts.push(`${char} ${LETTER_NAMES[char]}`);else if(MARK_NAMES[char])parts.push(MARK_NAMES[char])}return parts}
function pronunciationFromHebrew(value:string){const clusters:{letter:string;marks:string[]}[]=[];for(const char of Array.from(value.normalize('NFD'))){if(HEBREW_LETTER.test(char))clusters.push({letter:char,marks:[]});else if(clusters.length&&MARK_NAMES[char])clusters[clusters.length-1].marks.push(char)}return clusters.map((cluster,index)=>{const{letter,marks}=cluster;const has=(m:string)=>marks.includes(m);const last=index===clusters.length-1;if(letter==='ו'&&has('\u05BC')&&!marks.some(m=>['\u05B0','\u05B1','\u05B2','\u05B3','\u05B4','\u05B5','\u05B6','\u05B7','\u05B8','\u05B9','\u05BB','\u05C7'].includes(m)))return'u';if(letter==='ו'&&has('\u05B9'))return'o';let c='';switch(letter){case'א':case'ע':c='';break;case'ב':c=has('\u05BC')?'b':'v';break;case'ג':c='g';break;case'ד':c='d';break;case'ה':c=last&&marks.length===0?'':'h';break;case'ו':c='v';break;case'ז':c='z';break;case'ח':c='j';break;case'ט':c='t';break;case'י':c='y';break;case'כ':case'ך':c=has('\u05BC')?'k':'j';break;case'ל':c='l';break;case'מ':case'ם':c='m';break;case'נ':case'ן':c='n';break;case'ס':c='s';break;case'פ':case'ף':c=has('\u05BC')?'p':'f';break;case'צ':case'ץ':c='ts';break;case'ק':c='k';break;case'ר':c='r';break;case'ש':c=has('\u05C2')?'s':'sh';break;case'ת':c='t';break}let v='';if(has('\u05B4'))v='i';else if(has('\u05B5')||has('\u05B6')||has('\u05B1'))v='e';else if(has('\u05B7')||has('\u05B8')||has('\u05B2'))v='a';else if(has('\u05C7')||has('\u05B3')||has('\u05B9'))v='o';else if(has('\u05BB'))v='u';else if(has('\u05B0')&&!last)v='e';return c+v}).join('').replace(/yy/g,'y')}
function pronunciationFor(word:CatalogWord){return word.pronunciation??(word.lemma.match(HEBREW_MARKS)?pronunciationFromHebrew(word.lemma):null)??'—'}
function spanishFor(word:CatalogWord){return word.spanish??'—'}
function chunkWords(words:CatalogWord[],size:number){const rows:CatalogWord[][]=[];for(let i=0;i<words.length;i+=size)rows.push(words.slice(i,i+size));return rows}

function splitMeanings(value:string|null){return (value??'').split(/\s*[·;,/]\s*/).map(item=>item.trim()).filter(Boolean)}
function aggregateWords(words:CatalogWord[]){
  const grouped=new Map<string,CatalogWord & { meanings:string[] }>()
  for(const word of words){
    const key=word.lemma.normalize('NFC')
    const current=grouped.get(key)
    const meanings=splitMeanings(word.spanish)
    if(!current){grouped.set(key,{...word,meanings:[...new Set(meanings)]});continue}
    for(const meaning of meanings){if(!current.meanings.some(item=>item.toLocaleLowerCase('es')===meaning.toLocaleLowerCase('es')))current.meanings.push(meaning)}
    if(!current.pronunciation&&word.pronunciation)current.pronunciation=word.pronunciation
    if(!current.meaningNoteEs&&word.meaningNoteEs)current.meaningNoteEs=word.meaningNoteEs
  }
  return Array.from(grouped.values()).map(({meanings,...word})=>({...word,spanish:meanings.length?meanings.join(' · '):word.spanish}))
}

function WordText({word,mode,className}:{word:CatalogWord;mode:ReadingMode;className:string}){return <span lang="he" dir="rtl" className={className}>{mode==='nikud'?word.lemma:withoutNiqqud(word.lemma)}</span>}

function LearningDetail({word,mode}:{word:CatalogWord;mode:ReadingMode}){
  const pronunciation=pronunciationFor(word)
  const meanings=splitMeanings(word.spanish)
  const formation=formationParts(word.lemma)
  return <article className="mt-3 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
    <div className="p-4 text-center">
      <WordText word={word} mode={mode} className="block break-words text-[4.65rem] font-black leading-[1.2] text-slate-950"/>
      <p className="mt-1.5 text-[1.05rem] font-black text-indigo-700">{pronunciation}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">{meanings.length?meanings.map(meaning=><span key={meaning} className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-black text-slate-700">{meaning}</span>):<span className="text-xl font-black text-slate-950">—</span>}</div>
      <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-left">
        <div className="py-3.5"><p className="text-[10px] font-black uppercase text-slate-400">Cómo se pronuncia</p><p className="mt-1 font-black text-slate-800">{pronunciation}</p></div>
        <div className="py-3.5"><p className="text-[10px] font-black uppercase text-slate-400">Cómo se forma</p><p className="mt-1 text-[13px] leading-relaxed text-slate-700">{formation.length?formation.join(' + '):'La fuente general todavía no aporta desglose de niqqud para esta entrada.'}</p></div>
        <div className="py-3.5"><p className="text-[10px] font-black uppercase text-slate-400">Qué significa</p><p className="mt-1 text-[14px] font-bold text-slate-800">{word.meaningNoteEs??(meanings.length?`Puede significar: ${meanings.join(', ')}.`:'Sin significado español disponible.')}</p></div>
      </div>
    </div>
  </article>
}

function CardsView({words,mode,selectedId,onToggle,cardModes,onToggleNiqqud}:{words:CatalogWord[];mode:ReadingMode;selectedId:string|null;onToggle:(w:CatalogWord)=>void;cardModes:Record<string,ReadingMode>;onToggleNiqqud:(w:CatalogWord)=>void}){
  return <div className="space-y-4">{chunkWords(words,2).map((row,i)=>{const selected=row.find(w=>w.lexicalId===selectedId)??null;return <div key={i}><div className="grid grid-cols-2 gap-3">{row.map(word=>{const active=word.lexicalId===selectedId;const cardMode=cardModes[word.lexicalId]??mode;const meanings=splitMeanings(word.spanish);return <article key={word.lexicalId} className={`relative min-h-[154px] overflow-hidden rounded-[22px] border transition ${active?'border-indigo-500 bg-indigo-600 text-white':'border-slate-200 bg-white text-slate-950'}`}>
    <button type="button" aria-label={cardMode==='nikud'?'Ocultar niqqud en esta tarjeta':'Mostrar niqqud en esta tarjeta'} onClick={()=>onToggleNiqqud(word)} className={`absolute right-2 top-2 z-10 min-h-8 rounded-full px-2 text-[10px] font-black shadow-sm ${cardMode==='nikud'?'bg-indigo-100 text-indigo-700':'bg-slate-100 text-slate-500'}`}>נִקּוּד</button>
    <button type="button" onClick={()=>onToggle(word)} className="flex min-h-[154px] w-full flex-col items-center justify-center px-3 pb-3 pt-10 text-center active:scale-[0.985]">
      <WordText word={word} mode={cardMode} className="block break-words text-[3.05rem] font-black leading-tight"/>
      <span className={`mt-1.5 block text-[13px] font-black ${active?'text-indigo-100':'text-indigo-700'}`}>{pronunciationFor(word)}</span>
      <span className="mt-1 block text-[13px] font-black leading-snug">{meanings.length?meanings.join(' · '):'—'}</span>
    </button>
  </article>})}</div>{selected&&<LearningDetail word={selected} mode={cardModes[selected.lexicalId]??mode}/>}</div>})}</div>
}

function ListView({words,mode}:{words:CatalogWord[];mode:ReadingMode}){return <div className="-mx-4 divide-y divide-slate-200 border-y border-slate-200 bg-white px-4">{words.map(word=><div key={word.lexicalId} className="flex min-h-[88px] items-center justify-between gap-4 py-3"><div><WordText word={word} mode={mode} className="block text-[2.6rem] font-black text-slate-950"/><p className="text-[13px] font-black text-indigo-700">{pronunciationFor(word)}</p></div><p className="max-w-[48%] text-right text-[13px] font-black leading-snug text-slate-800">{spanishFor(word)}</p></div>)}</div>}

function WordsIntroduction(){const[open,setOpen]=useState(false);return <section className="border-y border-slate-200 text-left"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"><span><span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">מִלִּים</span><span className="mt-0.5 block text-sm font-black text-slate-950">Diccionario Hebreo ↔ Español</span></span><ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open?'rotate-180':''}`}/></button>{open&&<div className="border-t border-slate-200 p-4 text-[14px] leading-relaxed text-slate-600"><p><strong>Una palabra, una ficha:</strong> cuando la misma forma hebrea tiene varios significados españoles, se reúnen juntos para estudiarlos sin repetir tarjetas.</p><p className="mt-3">El selector superior cambia todo el catálogo y el botón <strong>נִקּוּד</strong> de cada tarjeta permite practicar esa palabra individualmente con o sin vocales.</p></div>}</section>}

export default function ReadingWordsExplorer(){
  const[mode,setMode]=useState<ReadingMode>('nikud')
  const[view,setView]=useState<WordView>('cards')
  const[group,setGroup]=useState<HebrewLearningGroupId>('essentials')
  const[page,setPage]=useState(1)
  const[result,setResult]=useState<CatalogResponse>(EMPTY_RESULT)
  const[loading,setLoading]=useState(true)
  const[error,setError]=useState<string|null>(null)
  const[searchInput,setSearchInput]=useState('')
  const[searching,setSearching]=useState(false)
  const[searchResult,setSearchResult]=useState<DictionaryResponse|null>(null)
  const[selectedId,setSelectedId]=useState<string|null>(null)
  const[cardModes,setCardModes]=useState<Record<string,ReadingMode>>({})
  const touchStartX=useRef<number|null>(null)
  const activeGroup=HEBREW_LEARNING_GROUPS.find(item=>item.id===group)??HEBREW_LEARNING_GROUPS[0]

  useEffect(()=>{let active=true;const controller=new AbortController();setLoading(true);setError(null);fetch(`/api/estudios/hebreo/palabras?page=${page}&pageSize=${PAGE_SIZE}&group=${group}`,{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error(response.status===401?'Tu sesión necesita renovarse.':'No se pudo cargar el catálogo.');const data=await response.json() as CatalogResponse;data.items=aggregateWords(data.items);if(active){setResult(data);setSelectedId(null);setCardModes({})}}).catch(cause=>{if(active&&!controller.signal.aborted)setError(cause instanceof Error?cause.message:'No se pudo cargar el catálogo.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false;controller.abort()}},[page,group])

  function changeGroup(next:HebrewLearningGroupId){if(next===group)return;setGroup(next);setPage(1);setSearchResult(null);setSearchInput('');setSelectedId(null);setCardModes({})}
  function toggleCard(word:CatalogWord){setSelectedId(current=>current===word.lexicalId?null:word.lexicalId)}
  function toggleCardNiqqud(word:CatalogWord){setCardModes(current=>({...current,[word.lexicalId]:(current[word.lexicalId]??mode)==='nikud'?'plain':'nikud'}))}
  function changeGlobalMode(next:ReadingMode){setMode(next);setCardModes({})}
  function changePage(next:number){if(next<1||next>result.totalPages||loading)return;setPage(next);setSelectedId(null);setCardModes({})}
  async function submitSearch(event:FormEvent<HTMLFormElement>){event.preventDefault();const query=searchInput.trim();if(!query){setSearchResult(null);return}setSearching(true);setError(null);setSelectedId(null);setCardModes({});try{const response=await fetch(`/api/estudios/hebreo/diccionario?q=${encodeURIComponent(query)}`,{cache:'no-store'});if(!response.ok)throw new Error('No se pudo consultar el diccionario.');const data=await response.json() as DictionaryResponse;data.items=aggregateWords(data.items);setSearchResult(data)}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo consultar el diccionario.')}finally{setSearching(false)}}
  function clearSearch(){setSearchInput('');setSearchResult(null);setSelectedId(null);setCardModes({})}
  function onTouchStart(event:TouchEvent<HTMLDivElement>){touchStartX.current=event.touches[0]?.clientX??null}
  function onTouchEnd(event:TouchEvent<HTMLDivElement>){if(searchResult||touchStartX.current===null)return;const end=event.changedTouches[0]?.clientX??touchStartX.current;const delta=end-touchStartX.current;touchStartX.current=null;if(Math.abs(delta)<70)return;if(delta<0)changePage(page+1);else changePage(page-1)}

  const visibleWords=searchResult?searchResult.items:result.items
  const noResults=Boolean(searchResult&&searchResult.total===0)

  return <section aria-labelledby="reading-words-title" className="text-left">
    <div className="text-center"><p lang="he" dir="rtl" className="text-[1.25rem] font-black text-indigo-700">מִלִּים</p><h2 id="reading-words-title" className="text-[1.65rem] font-black text-slate-950">Palabras</h2><p className="mt-1 text-[13px] text-slate-500">Diccionario visual Hebreo ↔ Español.</p></div>
    <div className="mt-5"><WordsIntroduction/></div>
    <div className="mt-4 grid grid-cols-2 rounded-[17px] bg-slate-100 p-1">{(['nikud','plain'] as const).map(item=><button key={item} type="button" onClick={()=>changeGlobalMode(item)} className={`min-h-10 rounded-[14px] text-[12px] font-black ${mode===item?'bg-white text-indigo-700 shadow-sm':'text-slate-500'}`}>{item==='nikud'?'Con niqqud':'Sin niqqud'}</button>)}</div>
    <div className="mt-2 grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1">{([['cards','Tarjetas',Grid2X2],['list','Lista',List],['detail','Detalle',Rows3]] as const).map(([id,label,Icon])=><button key={id} type="button" onClick={()=>{setView(id);setSelectedId(null)}} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] text-[11px] font-black ${view===id?'bg-white text-indigo-700 shadow-sm':'text-slate-500'}`}><Icon className="h-3.5 w-3.5"/>{label}</button>)}</div>
    <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex min-w-max gap-2">{HEBREW_LEARNING_GROUPS.map(item=><button key={item.id} type="button" onClick={()=>changeGroup(item.id)} className={`min-h-11 rounded-full border px-4 text-[12px] font-black ${group===item.id?'border-indigo-600 bg-indigo-600 text-white':'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}</div></div>
    <p className="mt-2 text-center text-[12px] text-slate-500">{activeGroup.description}</p>
    <form onSubmit={submitSearch} className="mt-4 flex min-h-11 items-center gap-2 rounded-[17px] border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400"/><input value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="Buscar gato, perro, casa, מים…" className="min-w-0 flex-1 bg-transparent py-2 text-[13px] outline-none"/><button type="submit" disabled={!searchInput.trim()||searching} className="text-[11px] font-black text-indigo-700 disabled:opacity-40">{searching?'Buscando…':'Buscar'}</button></form>
    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500"><span>{searchResult?`${visibleWords.length} palabras encontradas`:(loading?'Cargando palabras…':`${result.total.toLocaleString('es-SV')} entradas del catálogo`)}</span>{searchResult&&<button type="button" onClick={clearSearch} className="font-black text-indigo-700">Volver al catálogo</button>}</div>
    {error&&<div className="mt-4 rounded-[18px] bg-amber-50 p-4 text-center text-[12px] text-amber-900">{error}</div>}
    {noResults&&<div className="mt-5 border-y border-dashed border-slate-300 py-9 text-center"><p className="text-sm font-black text-slate-700">No encontramos esa palabra en el diccionario.</p><p className="mt-1 text-[11px] text-slate-400">El Traductor puede ayudarte con palabras o frases que todavía no estén indexadas aquí.</p></div>}
    {!error&&!noResults&&visibleWords.length>0&&<>
      {!searchResult&&<div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] bg-slate-50 px-2 py-2"><button type="button" disabled={page<=1||loading} onClick={()=>changePage(page-1)} className="flex min-h-10 items-center gap-1 rounded-full border bg-white px-3 text-[11px] font-black disabled:opacity-30"><ChevronLeft className="h-4 w-4"/>Anterior</button><p className="text-center text-[10px] font-black text-slate-500">Página {page}<br/>de {result.totalPages}</p><button type="button" disabled={page>=result.totalPages||loading} onClick={()=>changePage(page+1)} className="flex min-h-10 items-center gap-1 rounded-full border bg-white px-3 text-[11px] font-black disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4"/></button></div>}
      <div className="mt-5 touch-pan-y" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {view==='cards'&&<CardsView words={visibleWords} mode={mode} selectedId={selectedId} onToggle={toggleCard} cardModes={cardModes} onToggleNiqqud={toggleCardNiqqud}/>} 
        {view==='list'&&<ListView words={visibleWords} mode={mode}/>} 
        {view==='detail'&&visibleWords[0]&&<LearningDetail word={visibleWords.find(w=>w.lexicalId===selectedId)??visibleWords[0]} mode={mode}/>} 
      </div>
    </>}
    {!error&&!searchResult&&!loading&&result.items.length===0&&<div className="mt-5 border-y border-dashed border-slate-300 py-9 text-center text-sm text-slate-500">Esta categoría no tiene palabras disponibles.</div>}
  </section>
}
