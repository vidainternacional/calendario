'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'

type ReviewArea = 'all' | 'letters' | 'vowels' | 'words' | 'reading' | 'rules'
type ReviewRating = 'know' | 'practice' | 'later'

type ReviewItem = {
  id: string
  area: Exclude<ReviewArea, 'all'>
  label: string
  prompt: string
  hebrew?: string
  answer: string
  note: string
  writingTarget?: string
}

const AREAS: readonly { id: ReviewArea; label: string }[] = [
  { id: 'all', label: 'Mixto' },
  { id: 'letters', label: 'Letras' },
  { id: 'vowels', label: 'Vocales' },
  { id: 'words', label: 'Palabras' },
  { id: 'reading', label: 'Lectura' },
  { id: 'rules', label: 'Reglas' },
]

const ITEMS: readonly ReviewItem[] = [
  { id: 'bet', area: 'letters', label: 'Reconocer', prompt: '¿Qué letra es esta?', hebrew: 'ב', answer: 'Bet', note: 'Con dagesh suele representar /b/; sin dagesh, en la pronunciación pedagógica usada aquí, /v/.' },
  { id: 'pataj', area: 'vowels', label: 'Niqqud', prompt: '¿Qué signo vocálico aparece aquí?', hebrew: 'לַ', answer: 'Pataj · sonido orientativo a', note: 'El punto de esta práctica es reconocer el signo debajo de la consonante.' },
  { id: 'melekh', area: 'words', label: 'Vocabulario', prompt: 'Lee la palabra y recuerda su significado.', hebrew: 'מֶלֶךְ', answer: 'mélej · rey', note: 'Practica primero con niqqud y luego intenta reconocer מלך sin ayudas.' },
  { id: 'bereshit-bara', area: 'reading', label: 'Lectura', prompt: 'Lee las dos palabras de corrido.', hebrew: 'בְּרֵאשִׁית בָּרָא', answer: 'be-reshít bará · «en el principio creó…»', note: 'La meta aquí es continuidad de lectura, no memorizar una traducción palabra por palabra.' },
  { id: 'article', area: 'rules', label: 'Regla', prompt: '¿Qué función cumple esta pieza al inicio de una palabra?', hebrew: 'הַ', answer: 'Artículo definido', note: 'Normalmente introduce la idea de «el / la / los / las», con variaciones fonológicas según la palabra.' },
  { id: 'kaf-final', area: 'letters', label: 'Sofit', prompt: '¿Qué forma final estás viendo?', hebrew: 'ך', answer: 'Kaf final · Kaf sofit', note: 'Se usa al final de palabra. La forma normal correspondiente es כ.' },
  { id: 'tsere', area: 'vowels', label: 'Niqqud', prompt: 'Identifica el niqqud y su sonido orientativo.', hebrew: 'לֵ', answer: 'Tsere · sonido orientativo e', note: 'Compáralo visualmente con Segol: Tsere tiene dos puntos horizontales.' },
  { id: 'construct', area: 'rules', label: 'Construcción', prompt: '¿Qué relación muestra esta expresión?', hebrew: 'בֵּית הַמֶּלֶךְ', answer: '«la casa del rey» · estado constructo', note: 'בַּיִת cambia a בֵּית cuando queda ligado al sustantivo que sigue.' },
  { id: 'shalom', area: 'words', label: 'Vocabulario', prompt: '¿Cómo se lee y qué significa?', hebrew: 'שָׁלוֹם', answer: 'shalóm · paz', note: 'Observa Shin con su punto y Holam en la secuencia.' },
  { id: 'conjunction', area: 'rules', label: 'Prefijo', prompt: '¿Qué suele hacer esta pieza?', hebrew: 'וְ', answer: 'Conjunción · normalmente «y»', note: 'Se une a la palabra siguiente y su vocal puede variar.' },
  { id: 'bayit', area: 'words', label: 'Escritura', prompt: 'Escribe «casa» en hebreo sin niqqud y luego comprueba.', answer: 'בית', note: 'Con niqqud: בַּיִת · báyit · casa.', writingTarget: 'בית' },
  { id: 'segol', area: 'vowels', label: 'Niqqud', prompt: '¿Qué vocal ves aquí?', hebrew: 'לֶ', answer: 'Segol · sonido orientativo e', note: 'Segol se reconoce por sus tres puntos.' },
  { id: 'aleph', area: 'letters', label: 'Reconocer', prompt: 'Nombra esta letra.', hebrew: 'א', answer: 'Alef', note: 'Alef no representa por sí sola una vocal; su función fonética depende de la palabra y de la tradición de lectura.' },
  { id: 'preposition-b', area: 'rules', label: 'Prefijo', prompt: '¿Qué relación puede introducir esta pieza?', hebrew: 'בְּ', answer: 'Preposición · puede expresar «en», «con», «por» según contexto', note: 'No conviene memorizar una única traducción española para todas sus apariciones.' },
  { id: 'ha-davar-tov', area: 'reading', label: 'Lectura', prompt: 'Lee la frase completa sin separar cada signo.', hebrew: 'הַדָּבָר הַטּוֹב', answer: 'ha-davár ha-tóv · «la cosa / palabra buena»', note: 'Observa que el artículo aparece tanto en el sustantivo como en el adjetivo atributivo.' },
  { id: 'mem-final', area: 'letters', label: 'Sofit', prompt: '¿Cuál es la forma normal correspondiente?', hebrew: 'ם', answer: 'Mem · מ', note: 'ם aparece al final de palabra; מ es la forma normal.' },
  { id: 'sheva', area: 'vowels', label: 'Niqqud', prompt: 'Reconoce este signo.', hebrew: 'לְ', answer: 'Sheva', note: 'Su comportamiento no es siempre idéntico; esta etapa busca reconocerlo antes de estudiar todas sus reglas.' },
  { id: 'melekh-writing', area: 'words', label: 'Escritura', prompt: 'Escribe «rey» en hebreo sin niqqud.', answer: 'מלך', note: 'Con niqqud: מֶלֶךְ · mélej · rey.', writingTarget: 'מלך' },
  { id: 'genesis-short', area: 'reading', label: 'Lectura', prompt: 'Lee esta secuencia corta manteniendo el ritmo.', hebrew: 'אֵת הַשָּׁמַיִם', answer: 'et ha-shamáyim', note: 'No hace falta traducir אֵת como una palabra española independiente: aquí funciona como marcador gramatical.' },
  { id: 'plural', area: 'rules', label: 'Número', prompt: '¿Qué pista gramatical reconoces?', hebrew: 'טוֹבִים', answer: 'Plural; ־ִים es una terminación plural frecuente', note: 'Es una pista muy útil, pero no una regla absoluta para determinar género en todos los sustantivos.' },
] as const

function ReviewIntroduction() {
  const [open, setOpen] = useState(false)
  return (
    <section className="border-y border-slate-200 text-left">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 py-2">
        <span>
          <span lang="he" dir="rtl" className="block text-[12px] font-black text-indigo-700">חֲזָרָה</span>
          <span className="mt-0.5 block text-sm font-black text-slate-950">¿Cómo funciona el repaso?</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-slate-200 py-4">
          <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1 text-[14px] leading-relaxed text-slate-600 [-webkit-overflow-scrolling:touch]">
            <p>Repaso no es un examen. Mezcla elementos ya estudiados y te permite decidir qué recuerdas y qué conviene volver a practicar.</p>
            <p>Cada sesión usa hasta ocho elementos. Primero intenta responder; después revela la respuesta y clasifica cómo te fue.</p>
            <p>Por ahora las marcas existen solo durante esta sesión y no se guardan. La persistencia futura requerirá un diseño de datos y permisos aprobado por separado.</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default function ReviewExplorer() {
  const [area, setArea] = useState<ReviewArea>('all')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [ratings, setRatings] = useState<Record<string, ReviewRating>>({})
  const [writing, setWriting] = useState('')

  const session = useMemo(() => {
    const filtered = area === 'all' ? ITEMS : ITEMS.filter(item => item.area === area)
    return filtered.slice(0, 8)
  }, [area])

  const current = session[index] ?? null
  const finished = session.length > 0 && index >= session.length
  const counts = Object.values(ratings).reduce((acc, value) => {
    acc[value] += 1
    return acc
  }, { know: 0, practice: 0, later: 0 } as Record<ReviewRating, number>)

  function changeArea(next: ReviewArea) {
    setArea(next)
    setIndex(0)
    setRevealed(false)
    setRatings({})
    setWriting('')
  }

  function restart() {
    setIndex(0)
    setRevealed(false)
    setRatings({})
    setWriting('')
  }

  function rate(value: ReviewRating) {
    if (!current) return
    setRatings(previous => ({ ...previous, [current.id]: value }))
    setIndex(currentIndex => currentIndex + 1)
    setRevealed(false)
    setWriting('')
  }

  return (
    <section aria-labelledby="review-title" className="text-left">
      <div className="text-center">
        <p lang="he" dir="rtl" className="text-[1rem] font-black text-indigo-700">חֲזָרָה</p>
        <h2 id="review-title" className="mt-0.5 text-[1.65rem] font-black tracking-[-0.025em] text-slate-950">Repasa lo que ya estudiaste</h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-slate-500">Sesiones breves para recuperar letras, vocales, palabras, lectura y reglas sin convertirlo en otro examen.</p>
      </div>

      <div className="mt-5"><ReviewIntroduction /></div>

      <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {AREAS.map(item => (
            <button key={item.id} type="button" aria-pressed={area === item.id} onClick={() => changeArea(item.id)} className={`min-h-11 rounded-full border px-4 text-[12px] font-black ${area === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>
          ))}
        </div>
      </div>

      {!finished && current && (
        <div className="mt-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">{current.label}</p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-400">Elemento {index + 1} de {session.length}</p>
            </div>
            <p className="text-[10px] font-black text-slate-400">Solo esta sesión</p>
          </div>

          <div className="py-6 text-center">
            <h3 className="mx-auto max-w-lg text-[1.15rem] font-black leading-snug text-slate-950">{current.prompt}</h3>
            {current.hebrew && <p lang="he" dir="rtl" className="my-6 break-words text-[4.6rem] font-black leading-[1.25] text-indigo-700">{current.hebrew}</p>}
            {current.writingTarget && (
              <div className="mx-auto mt-5 max-w-md">
                <input
                  type="text"
                  lang="he"
                  dir="rtl"
                  data-hebrew-practice="true"
                  value={writing}
                  onChange={event => setWriting(event.target.value)}
                  placeholder="כתוב כאן…"
                  className="min-h-16 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-center text-[2.5rem] font-black text-slate-950 outline-none focus:border-indigo-400"
                />
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">Puedes usar el teclado nativo o activar el teclado hebreo de VIDA arriba.</p>
              </div>
            )}
          </div>

          {!revealed ? (
            <button type="button" onClick={() => setRevealed(true)} className="min-h-12 w-full rounded-full bg-indigo-600 px-5 text-sm font-black text-white">Mostrar respuesta</button>
          ) : (
            <div className="border-t border-slate-200 pt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Respuesta</p>
              <p className="mt-1 text-center text-[1.2rem] font-black leading-relaxed text-slate-950">{current.answer}</p>
              <p className="mx-auto mt-2 max-w-xl text-center text-[12px] font-semibold leading-relaxed text-slate-500">{current.note}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => rate('know')} className="min-h-12 rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-black text-emerald-800">Lo sé</button>
                <button type="button" onClick={() => rate('practice')} className="min-h-12 rounded-[16px] border border-amber-200 bg-amber-50 px-3 text-[12px] font-black text-amber-800">Necesito practicar</button>
                <button type="button" onClick={() => rate('later')} className="min-h-12 rounded-[16px] border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-600">Repasar después</button>
              </div>
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="mt-5 text-center">
          <p lang="he" dir="rtl" className="text-[2.5rem] font-black text-indigo-700">כָּל הַכָּבוֹד</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Sesión terminada</h3>
          <p className="mt-1 text-[12px] text-slate-500">Este resumen describe únicamente lo que marcaste ahora. No se guarda como progreso.</p>
          <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-4">
            <div><p className="text-2xl font-black text-emerald-700">{counts.know}</p><p className="mt-1 text-[10px] font-black text-slate-500">Lo sé</p></div>
            <div><p className="text-2xl font-black text-amber-700">{counts.practice}</p><p className="mt-1 text-[10px] font-black text-slate-500">Practicar</p></div>
            <div><p className="text-2xl font-black text-slate-600">{counts.later}</p><p className="mt-1 text-[10px] font-black text-slate-500">Después</p></div>
          </div>
          <button type="button" onClick={restart} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-black text-white"><RotateCcw className="h-4 w-4" aria-hidden="true" />Repetir sesión</button>
        </div>
      )}
    </section>
  )
}
