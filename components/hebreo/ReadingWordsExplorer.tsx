'use client'

import { type FormEvent, type TouchEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
const PREFETCH_FORWARD = 5
const PREFETCH_BACK = 2
const EMPTY_RESULT: CatalogResponse = { status: 'ok', page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0, search: '', group: 'essentials', items: [] }
const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g
const HEBREW_LETTER = /[\u05D0-\u05EA]/
const LETTER_NAMES: Record<string, string> = { א:'Alef',ב:'Bet',ג:'Guímel',ד:'Dálet',ה:'He',ו:'Vav',ז:'Zayin',ח:'Jet',ט:'Tet',י:'Yod',כ:'Kaf',ך:'Kaf final',ל:'Lamed',מ:'Mem',ם:'Mem final',נ:'Nun',ן:'Nun final',ס:'Sámej',ע:'Ayin',פ:'Pe',ף:'Pe final',צ:'Tsadi',ץ:'Tsadi final',ק:'Qof',ר:'Resh',ש:'Shin / Sin',ת:'Tav' }
const MARK_NAMES: Record<string,string> = {'\u05B0':'Sheva','\u05B1':'Hataf Segol','\u05B2':'Hataf Pataj','\u05B3':'Hataf Qamats','\u05B4':'Hiriq','\u05B5':'Tsere','\u05B6':'Segol','\u05B7':'Pataj','\u05B8':'Qamats','\u05B9':'Holam','\u05BB':'Qubuts','\u05BC':'Dagesh','\u05C1':'punto de Shin','\u05C2':'punto de Sin','\u05C7':'Qamats qatan'}

function withoutNiqqud(value: string) { return value.normalize('NFD').replace(HEBREW_MARKS, '').normalize('NFC') }
function formationParts(value: string) { const parts:string[]=[]; for (const char of Array.from(value.normalize('NFD'))) { if (LETTER_NAMES[char]) parts.push(`${char} ${LETTER_NAMES[char]}`); else if (MARK_NAMES[char]) parts.push(MARK_NAMES[char]) } return parts }
function pronunciationFromHebrew(value:string){const clusters:{letter:string;marks:string[]}[]=[];for(const char of Array.from(value.normalize('NFD'))){if(HEBREW_LETTER.test(char))clusters.push({letter:char,marks:[]});else if(clusters.length>0&&MARK_NAMES[char])clusters[clusters.length-1].marks.push(char)}return clusters.map((cluster,index)=>{const{letter,marks}=cluster;const has=(mark:string)=>marks.includes(mark);const last=index===clusters.length-1;if(letter==='ו'&&has('\u05BC')&&!marks.some(mark=>['\u05B0','\u05B1','\u05B2','\u05B3','\u05B4','\u05B5','\u05B6','\u05B7','\u05B8','\u05B9','\u05BB','\u05C7'].includes(mark)))return'u';if(letter==='ו'&&has('\u05B9'))return'o';let consonant='';switch(letter){case'א':case'ע':consonant='';break;case'ב':consonant=has('\u05BC')?'b':'v';break;case'ג':consonant='g';break;case'ד':consonant='d';break;case'ה':consonant=last&&marks.length===0?'':'h';break;case'ו':consonant='v';break;case'ז':consonant='z';break;case'ח':consonant='j';break;case'ט':consonant='t';break;case'י':consonant='y';break;case'כ':case'ך':consonant=has('\u05BC')?'k':'j';break;case'ל':consonant='l';break;case'מ':case'ם':consonant='m';break;case'נ':case'ן':consonant='n';break;case'ס':consonant='s';break;case'פ':case'ף':consonant=has('\u05BC')?'p':'f';break;case'צ':case'ץ':consonant='ts';break;case'ק':consonant='k';break;case'ר':consonant='r';break;case'ש':consonant=has('\u05C2')?'s':'sh';break;case'ת':consonant='t';break}let vowel='';if(has('\u05B4'))vowel='i';else if(has('\u05B5')||has('\u05B6')||has('\u05B1'))vowel='e';else if(has('\u05B7')||has('\u05B8')||has('\u05B2'))vowel='a';else if(has('\u05C7')||has('\u05B3')||has('\u05B9'))vowel='o';else if(has('\u05BB'))vowel='u';else if(has('\u05B0')&&!last)vowel='e';return consonant+vowel}).join('').replace(/yy/g,'y')}
function pronunciationFor(word: CatalogWord) { return word.pronunciation ?? (word.lemma.match(HEBREW_MARKS) ? pronunciationFromHebrew(word.lemma) : null) ?? '—' }
function spanishFor(word: CatalogWord) { return word.spanish ?? '—' }
function chunkWords(words: CatalogWord[], size: number) { const rows:CatalogWord[][]=[]; for(let i=0;i<words.length;i+=size) rows.push(words.slice(i,i+size)); return rows }
function dedupeWords(words: CatalogWord[]) { const seen=new Set<string>(); return words.filter(word=>{const key=`${withoutNiqqud(word.lemma)}\u0000${(word.spanish??'').trim().toLowerCase()}`; if(seen.has(key)) return false; seen.add(key); return true}) }

function WordsIntroduction(){const[open,setOpen]=useState(false);return <section className="border-y border-slate-200 text-left"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"><span><span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">מִלִּים</span><span className="mt-0.5 block text-sm font-black text-slate-950">Diccionario Hebreo ↔ Español</span></span><ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open?'rotate-180':''}`}/></button>{open&&<div className="border-t border-slate-200 p-4 text-[14px] leading-relaxed text-slate-600"><p><strong>Buscar</strong> consulta equivalencias exactas del diccionario general piloto. Si una palabra no existe, no inventa una aproximación.</p><p className="mt-3"><strong>Explorar</strong> conserva el vocabulario bíblico de VIDA y precarga varias páginas para que el desplazamiento lateral no dependa de una consulta por cada gesto.</p></div>}</section>}
function ModeControl({mode,onChange}:{mode:ReadingMode;onChange:(m:ReadingMode)=>void}){return <div className="grid grid-cols-2 rounded-[17px] bg-slate-100 p-1">{([{id:'nikud',label:'Con niqqud'},{id:'plain',label:'Sin niqqud'}] as const).map(item=><button key={item.id} type="button" onClick={()=>onChange(item.id)} className={`min-h-10 rounded-[14px] text-[12px] font-black ${mode===item.id?'bg-white text-indigo-700 shadow-sm':'text-slate-500'}`}>{item.label}</button>)}</div>}
function ViewControl({view,onChange}:{view:WordView;onChange:(v:WordView)=>void}){const views=[['cards','Tarjetas',Grid2X2],['list','Lista',List],['detail','Detalle',Rows3]] as const;return <div className="grid grid-cols-3 gap-1 rounded-[17px] bg-slate-100 p-1">{views.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>onChange(id)} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] text-[11px] font-black ${view===id?'bg-white text-indigo-700 shadow-sm':'text-slate-500'}`}><Icon className="h-3.5 w-3.5"/>{label}</button>)}</div>}
function WordText({word,mode,className}:{word:CatalogWord;mode:ReadingMode;className:string}){return <span lang="he" dir="rtl" className={className}>{mode==='nikud'?word.lemma:withoutNiqqud(word.lemma)}</span>}
function LearningDetail({word,mode,compact=false}:{word:CatalogWord;mode:ReadingMode;compact?:boolean}){const pronunciation=pronunciationFor(word),spanish=spanishFor(word),formation=formationParts(word.lemma);return <article className={`${compact?'mt-3':''} overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]`}><div className="p-4 text-center"><WordText word={word} mode={mode} className={`${compact?'text-[4.65rem]':'text-[5.5rem]'} block break-words font-black leading-[1.2] text-slate-950`}/><p className="mt-1.5 text-[1.05rem] font-black text-indigo-700">{pronunciation}</p><p className="mt-1 text-xl font-black text-slate-950">{spanish}</p><div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-left"><div className="py-3.5"><p className="text-[10px] font-black uppercase text-slate-400">Cómo se pronuncia</p><p className="mt-1 font-black text-slate-800">{pronunciation}</p></div><div className="py-3.5"><p className="text-[10px] font-black uppercase text-slate-400">Cómo se forma</p><p className="mt-1 text-[13px] leading-relaxed text-slate-700">{formation.length?formation.join(' + '):'La fuente general todavía no aporta desglose de niqqud para esta entrada.'}</p></div><div className="py-3.5"><p className="text-[10px] font-black uppercase text-slate-400">Qué significa</p><p className="mt-1 text-[14px] font-bold text-slate-800">{word.meaningNoteEs??`Significa «${spanish}».`}</p></div></div></div></article>}
function CardsView({words,mode,selectedId,onToggle}:{words:CatalogWord[];mode:ReadingMode;selectedId:string|null;onToggle:(w:CatalogWord)=>void}){return <div className="space-y-4">{chunkWords(words,2).map((row,i)=>{const selected=row.find(w=>w.lexicalId===selectedId)??null;return <div key={i}><div className="grid grid-cols-2 gap-3">{row.map(word=>{const active=word.lexicalId===selectedId;return <button key={word.lexicalId} type="button" onClick={()=>onToggle(word)} className={`min-h-[140px] rounded-[22px] border px-3 py-3 text-center transition active:scale-[0.985] ${active?'border-indigo-500 bg-indigo-600 text-white':'border-slate-200 bg-white text-slate-950'}`}><WordText word={word} mode={mode} className="block break-words text-[3.05rem] font-black leading-tight"/><span className={`mt-1.5 block text-[13px] font-black ${active?'text-indigo-100':'text-indigo-700'}`}>{pronunciationFor(word)}</span><span className="mt-1 block text-[14px] font-black">{spanishFor(word)}</span></button>})}</div>{selected&&<LearningDetail word={selected} mode={mode} compact/>}</div>})}</div>}
function ListView({words,mode}:{words:CatalogWord[];mode:ReadingMode}){return <div className="-mx-4 divide-y divide-slate-200 border-y border-slate-200 bg-white px-4">{words.map(word=><div key={word.lexicalId} className="flex min-h-[88px] items-center justify-between gap-4 py-3"><div><WordText word={word} mode={mode} className="block text-[2.6rem] font-black text-slate-950"/><p className="text-[13px] font-black text-indigo-700">{pronunciationFor(word)}</p></div><p className="max-w-[44%] text-right text-[14px] font-black text-slate-800">{spanishFor(word)}</p></div>)}</div>}
function DetailView({word,mode}:{word:CatalogWord|null;mode:ReadingMode}){if(!word)return null;return <LearningDetail word={word} mode={mode}/>}
function SlideContent({words,view,mode,selectedId,onToggle}:{words:CatalogWord[];view:WordView;mode:ReadingMode;selectedId:string|null;onToggle:(w:CatalogWord)=>void}){const selected=words.find(w=>w.lexicalId===selectedId)??words[0]??null;return <div className="w-full px-2">{view==='cards'&&<CardsView words={words} mode={mode} selectedId={selectedId} onToggle={onToggle}/>} {view==='list'&&<ListView words={words} mode={mode}/>} {view==='detail'&&<DetailView word={selected} mode={mode}/>}</div>}

export default function ReadingWordsExplorer(){
  const[mode,setMode]=useState<ReadingMode>('nikud')
  const[view,setView]=useState<WordView>('cards')
  const[group,setGroup]=useState<HebrewLearningGroupId>('essentials')
  const[page,setPage]=useState(1)
  const[current,setCurrent]=useState<CatalogResponse>(EMPTY_RESULT)
  const[loading,setLoading]=useState(true)
  const[error,setError]=useState<string|null>(null)
  const[searchInput,setSearchInput]=useState('')
  const[searching,setSearching]=useState(false)
  const[searchResult,setSearchResult]=useState<DictionaryResponse|null>(null)
  const[selectedId,setSelectedId]=useState<string|null>(null)
  const[width,setWidth]=useState(0)
  const[dragX,setDragX]=useState(0)
  const[settlingTo,setSettlingTo]=useState<-1|0|1>(0)
  const[transitioning,setTransitioning]=useState(false)
  const[,bumpCache]=useState(0)
  const cacheRef=useRef(new Map<number,CatalogResponse>())
  const requestRef=useRef(new Map<number,Promise<CatalogResponse>>())
  const carouselRef=useRef<HTMLDivElement|null>(null)
  const touchStartX=useRef<number|null>(null)
  const activeGroup=HEBREW_LEARNING_GROUPS.find(item=>item.id===group)??HEBREW_LEARNING_GROUPS[0]

  useLayoutEffect(()=>{const node=carouselRef.current;if(!node)return;const update=()=>setWidth(node.clientWidth);update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect()},[current.items.length,view,group])

  async function fetchPage(target:number){
    const cached=cacheRef.current.get(target); if(cached)return cached
    const pending=requestRef.current.get(target); if(pending)return pending
    const promise=fetch(`/api/estudios/hebreo/palabras?page=${target}&pageSize=${PAGE_SIZE}&group=${group}`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error(response.status===401?'Tu sesión necesita renovarse.':'No se pudo cargar el catálogo.');const data=await response.json() as CatalogResponse;data.items=dedupeWords(data.items);cacheRef.current.set(target,data);requestRef.current.delete(target);bumpCache(version=>version+1);return data}).catch(cause=>{requestRef.current.delete(target);throw cause})
    requestRef.current.set(target,promise);return promise
  }

  function prefetchAround(base:number,totalPages:number){
    const targets:number[]=[]
    for(let i=1;i<=PREFETCH_FORWARD;i+=1)if(base+i<=totalPages)targets.push(base+i)
    for(let i=1;i<=PREFETCH_BACK;i+=1)if(base-i>=1)targets.push(base-i)
    void Promise.allSettled(targets.map(target=>fetchPage(target)))
  }

  useEffect(()=>{cacheRef.current.clear();requestRef.current.clear();setPage(1);setCurrent(EMPTY_RESULT);setSearchResult(null);setSelectedId(null);bumpCache(version=>version+1)},[group])

  useEffect(()=>{let active=true;setLoading(true);setError(null);fetchPage(page).then(data=>{if(!active)return;setCurrent(data);setSelectedId(null);prefetchAround(page,data.totalPages)}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'No se pudo cargar el catálogo.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[page,group])

  const previous=page>1?cacheRef.current.get(page-1)??null:null
  const next=page<current.totalPages?cacheRef.current.get(page+1)??null:null
  const currentWords=current.items
  const searchWords=searchResult?.items??[]

  function toggleCard(word:CatalogWord){setSelectedId(currentId=>currentId===word.lexicalId?null:word.lexicalId)}
  function changeView(nextView:WordView){setView(nextView);setSelectedId(null)}
  function changeGroup(nextGroup:HebrewLearningGroupId){if(nextGroup===group)return;setGroup(nextGroup)}

  async function submitSearch(event:FormEvent<HTMLFormElement>){event.preventDefault();const query=searchInput.trim();if(!query){setSearchResult(null);return}setSearching(true);setError(null);setSelectedId(null);try{const response=await fetch(`/api/estudios/hebreo/diccionario?q=${encodeURIComponent(query)}`,{cache:'no-store'});if(!response.ok)throw new Error('No se pudo consultar el diccionario.');const data=await response.json() as DictionaryResponse;data.items=dedupeWords(data.items);setSearchResult(data)}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo consultar el diccionario.')}finally{setSearching(false)}}
  function clearSearch(){setSearchInput('');setSearchResult(null);setSelectedId(null)}

  function commitPage(direction:-1|1){
    const target=page+direction
    const cached=cacheRef.current.get(target)
    if(!cached)return
    setPage(target)
    setCurrent(cached)
    setSelectedId(null)
    prefetchAround(target,cached.totalPages)
  }

  function finishSwipe(direction:-1|1){
    if(transitioning||width<=0)return
    const available=direction<0?Boolean(previous):Boolean(next)
    if(!available){setTransitioning(true);setSettlingTo(0);window.setTimeout(()=>{setDragX(0);setTransitioning(false)},180);return}
    setTransitioning(true);setSettlingTo(direction)
    window.setTimeout(()=>{commitPage(direction);setTransitioning(false);setSettlingTo(0);setDragX(0)},230)
  }

  function onTouchStart(event:TouchEvent<HTMLDivElement>){if(searchResult||transitioning)return;touchStartX.current=event.touches[0]?.clientX??null;setDragX(0)}
  function onTouchMove(event:TouchEvent<HTMLDivElement>){if(searchResult||transitioning||touchStartX.current===null)return;const delta=(event.touches[0]?.clientX??touchStartX.current)-touchStartX.current;const canLeft=Boolean(next),canRight=Boolean(previous);const resistance=(delta<0&&!canLeft)||(delta>0&&!canRight)?0.28:1;setDragX(delta*resistance)}
  function onTouchEnd(){if(searchResult||transitioning||touchStartX.current===null||width<=0){touchStartX.current=null;return}const threshold=Math.min(72,width*0.18);const delta=dragX;touchStartX.current=null;if(delta<=-threshold)finishSwipe(1);else if(delta>=threshold)finishSwipe(-1);else{setTransitioning(true);setSettlingTo(0);window.setTimeout(()=>{setDragX(0);setTransitioning(false)},180)}}

  const trackOffset=width<=0?0:(-width+dragX-(settlingTo*width))
  const displayWords=searchResult?searchWords:currentWords
  const noResults=Boolean(searchResult&&searchResult.total===0)

  return <section aria-labelledby="reading-words-title" className="text-left">
    <div className="text-center"><p lang="he" dir="rtl" className="text-[1.25rem] font-black text-indigo-700">מִלִּים</p><h2 id="reading-words-title" className="text-[1.65rem] font-black text-slate-950">Palabras</h2><p className="mt-1 text-[13px] text-slate-500">Diccionario visual Hebreo ↔ Español.</p></div>
    <div className="mt-5"><WordsIntroduction/></div>
    <div className="mt-4 space-y-2.5"><ModeControl mode={mode} onChange={setMode}/><ViewControl view={view} onChange={changeView}/></div>
    <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex min-w-max gap-2">{HEBREW_LEARNING_GROUPS.map(item=><button key={item.id} type="button" onClick={()=>changeGroup(item.id)} className={`min-h-11 rounded-full border px-4 text-[12px] font-black ${group===item.id?'border-indigo-600 bg-indigo-600 text-white':'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}</div></div>
    <p className="mt-2 text-center text-[12px] text-slate-500">{activeGroup.description}</p>
    <form onSubmit={submitSearch} className="mt-4 flex min-h-11 items-center gap-2 rounded-[17px] border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400"/><input value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="Buscar gato, perro, casa, מים…" className="min-w-0 flex-1 bg-transparent py-2 text-[13px] outline-none"/><button type="submit" disabled={!searchInput.trim()||searching} className="text-[11px] font-black text-indigo-700 disabled:opacity-40">{searching?'Buscando…':'Buscar'}</button></form>
    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500"><span>{searchResult?`${searchResult.total} coincidencias exactas`:(loading?'Cargando palabras…':`${current.total.toLocaleString('es-SV')} palabras bíblicas`)}</span>{searchResult&&<button type="button" onClick={clearSearch} className="font-black text-indigo-700">Volver al catálogo</button>}</div>
    {error&&<div className="mt-4 rounded-[18px] bg-amber-50 p-4 text-center text-[12px] text-amber-900">{error}</div>}
    {noResults&&<div className="mt-5 border-y border-dashed border-slate-300 py-9 text-center"><p className="text-sm font-black text-slate-700">No encontramos esa palabra en el diccionario.</p><p className="mt-1 text-[11px] text-slate-400">El Traductor puede ayudarte con palabras o frases que todavía no estén indexadas aquí.</p></div>}
    {!error&&!noResults&&searchResult&&displayWords.length>0&&<div className="mt-5"><SlideContent words={displayWords} view={view} mode={mode} selectedId={selectedId} onToggle={toggleCard}/></div>}
    {!error&&!searchResult&&current.items.length>0&&<>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] bg-slate-50 px-2 py-2"><button type="button" disabled={page<=1||loading} onClick={()=>finishSwipe(-1)} className="flex min-h-10 items-center gap-1 rounded-full border bg-white px-3 text-[11px] font-black disabled:opacity-30"><ChevronLeft className="h-4 w-4"/>Anterior</button><p className="text-center text-[10px] font-black text-slate-500">Página {page}<br/>de {current.totalPages}</p><button type="button" disabled={page>=current.totalPages||loading||!next} onClick={()=>finishSwipe(1)} className="flex min-h-10 items-center gap-1 rounded-full border bg-white px-3 text-[11px] font-black disabled:opacity-30">Siguiente<ChevronRight className="h-4 w-4"/></button></div>
      <div ref={carouselRef} className="mt-5 w-full overflow-hidden rounded-[4px] touch-pan-y" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
        <div className="flex w-[300%] will-change-transform" style={{transform:`translate3d(${trackOffset}px,0,0)`,transition:transitioning?'transform 220ms cubic-bezier(0.22,1,0.36,1)':'none'}}>
          <div className="w-1/3 shrink-0 overflow-hidden">{previous?<SlideContent words={previous.items} view={view} mode={mode} selectedId={null} onToggle={()=>{}}/>:<div className="w-full"/>}</div>
          <div className="w-1/3 shrink-0 overflow-hidden"><SlideContent words={current.items} view={view} mode={mode} selectedId={selectedId} onToggle={toggleCard}/></div>
          <div className="w-1/3 shrink-0 overflow-hidden">{next?<SlideContent words={next.items} view={view} mode={mode} selectedId={null} onToggle={()=>{}}/>:<div className="w-full"/>}</div>
        </div>
      </div>
      <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">Varias páginas se precargan en memoria. Desliza a izquierda o derecha; cada superficie ocupa todo el ancho y no vuelve a consultar el servidor al cambiar entre páginas ya preparadas.</p>
    </>}
  </section>
}
