'use client'

import { useState } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'

type RuleTopic = {
  id: string
  step: number
  label: string
  he?: string
  title: string
  what: string
  when: string
  example?: string
  exampleEs?: string
  caution?: string
  tip?: string
}

const TOPICS: readonly RuleTopic[] = [
  { id: 'sheva', step: 1, label: 'Sheva', he: 'שְׁוָא', title: 'Sheva: dos funciones', what: 'El sheva es el signo ְ debajo de una consonante. Puede representar una vocal muy breve/móvil o indicar ausencia de vocal.', when: 'Primero identifica dónde aparece dentro de la palabra y evita asignarle siempre el mismo sonido.', example: 'שְׁמַע', exampleEs: 'shemá', caution: 'La clasificación exacta depende de la estructura de la palabra; no todo sheva se pronuncia igual.', tip: 'No memorices el sheva aislado: léelo dentro de sílabas y palabras reales.' },
  { id: 'dagesh', step: 2, label: 'Dagesh', he: 'דָּגֵשׁ', title: 'Dagesh: el punto interior', what: 'El dagesh es un punto dentro de una consonante. En las letras Begadkefat puede marcar una pronunciación más fuerte; también existe dagesh fuerte con función gramatical.', when: 'Obsérvalo especialmente en בּ / ב, כּ / כ y פּ / פ, donde el contraste es muy útil para comenzar a leer.', example: 'בּ · ב  /  כּ · כ  /  פּ · פ', caution: 'No todo dagesh cumple exactamente la misma función. Primero reconoce el punto; después determina qué tipo es.', tip: 'Cuando veas un punto dentro de una letra, detente un instante y comprueba si cambia el sonido.' },
  { id: 'shin-sin', step: 3, label: 'Shin / Sin', he: 'שׁ · שׂ', title: 'Shin y Sin', what: 'La misma forma consonántica ש cambia de lectura según la posición del punto superior.', when: 'Punto a la derecha: שׁ = sh. Punto a la izquierda: שׂ = s.', example: 'שׁ = sh   ·   שׂ = s', tip: 'Mira primero el punto superior antes de intentar pronunciar la palabra.' },
  { id: 'syllables', step: 4, label: 'Sílabas', title: 'Consonante + vocal', what: 'La lectura se construye uniendo la consonante con el signo vocálico que la acompaña y agrupando después las sílabas.', when: 'Después de reconocer letras y vocales, lee por bloques pequeños antes de intentar decir la palabra completa.', example: 'בָּ + רָ + א', exampleEs: 'ba · ra → bará', tip: 'Primero lento y correcto; la velocidad llega con repetición.' },
  { id: 'matres', step: 5, label: 'Matres', he: 'אִמּוֹת קְרִיאָה', title: 'Letras que ayudan a leer vocales', what: 'Alef, He, Vav y Yod siguen siendo consonantes, pero en ciertos contextos también ayudan a representar o sostener una vocal.', when: 'Reconoce esta función dentro de la palabra; no las conviertas en una categoría de vocal independiente.', example: 'אוֹר · תּוֹרָה · שִׁיר', caution: 'La función depende del contexto ortográfico.' },
  { id: 'article', step: 6, label: 'Artículo', he: 'הַ', title: 'Artículo definido', what: 'El artículo se une al inicio de la palabra y expresa la idea de el, la, los o las.', when: 'Su forma básica es הַ y con frecuencia influye en la consonante que sigue.', example: 'הַדָּבָר', exampleEs: 'ha-davár · la palabra / cosa', caution: 'Con guturales aparecen variaciones; aprende primero el patrón básico.' },
  { id: 'inseparables', step: 7, label: 'Prefijos', he: 'בְּ · לְ · כְּ · וְ', title: 'Prefijos inseparables', what: 'Son pequeñas piezas que se pegan a la palabra y expresan relaciones como en, a/para, como o y.', when: 'Sepáralas mentalmente antes de buscar la palabra principal.', example: 'בְּרֵאשִׁית · לְאִישׁ', exampleEs: 'en el principio · a/para un hombre', tip: 'Busca primero la pieza conocida al inicio; después lee el resto de la palabra.' },
  { id: 'gender', step: 8, label: 'Género', title: 'Masculino y femenino', what: 'El hebreo distingue género gramatical. Algunas terminaciones ayudan a reconocer muchas formas femeninas.', when: 'Usa terminaciones como ־ָה como pistas y confirma después por la palabra y su contexto.', example: 'טוֹב · טוֹבָה', exampleEs: 'tov · tová · bueno / buena', caution: 'La terminación es una pista, no una garantía absoluta.' },
  { id: 'number', step: 9, label: 'Número', title: 'Singular y plural', what: 'Muchas formas plurales muestran terminaciones reconocibles.', when: '־ִים aparece frecuentemente en masculino plural y ־וֹת en femenino plural.', example: 'טוֹבִים · טוֹבוֹת', exampleEs: 'tovím · tovót', caution: 'Existen excepciones de género y terminación.' },
  { id: 'suffixes', step: 10, label: 'Sufijos', title: 'Sufijos pronominales', what: 'Algunos pronombres se unen al final de nombres, preposiciones o verbos y aportan información de persona, género y número.', when: 'Identifica primero la base y después separa mentalmente la terminación.', caution: 'La forma de la base puede cambiar al recibir un sufijo.' },
  { id: 'possession', step: 11, label: 'Posesión', title: 'Expresar posesión', what: 'La posesión puede expresarse mediante sufijos pronominales o mediante construcciones entre nombres.', when: 'No busques siempre una palabra independiente equivalente a mi, tu o su; observa el final de la palabra y la estructura completa.' },
  { id: 'construct', step: 12, label: 'Constructo', title: 'Cadena constructa', what: 'Dos nombres pueden unirse como una sola unidad para expresar una relación que en español suele traducirse con de.', when: 'El primer nombre queda ligado al segundo y puede cambiar de forma.', example: 'בֵּית הַמֶּלֶךְ', exampleEs: 'beit ha-mélej · la casa del rey', caution: 'La definitud de la cadena depende del segundo elemento.' },
  { id: 'roots', step: 13, label: 'Raíces', title: 'Raíz triconsonántica', what: 'Muchas familias de palabras se estudian reconociendo una base de tres consonantes relacionada con su formación léxica.', when: 'Separa prefijos y sufijos conocidos antes de intentar reconocer la raíz.', caution: 'No inventes una raíz solo por parecido visual; debe verificarse léxicamente.', tip: 'Desarma la palabra por capas: prefijo → base → sufijo.' },
  { id: 'verbs', step: 14, label: 'Verbos', he: 'אָמַר', title: 'Sistema verbal', what: 'Los verbos cambian de forma para expresar persona, género, número y distintas perspectivas de la acción.', when: 'Empieza reconociendo el lema y qué parte de la forma cambió; después estudia qatal, yiqtol, imperativo, participio y formas secuenciales.', example: 'אָמַר · יֹאמַר · אֱמֹר', exampleEs: 'amár · yomár · emór', caution: 'Qatal no significa automáticamente pasado ni yiqtol automáticamente futuro; el contexto es decisivo.' },
  { id: 'qere-ketiv', step: 15, label: 'Qere / Ketiv', he: 'קְרֵי / כְּתִיב', title: 'Lo escrito y lo leído', what: 'En el texto masorético algunas tradiciones distinguen entre la forma escrita y la lectura transmitida.', when: 'Trátalo como una nota textual de lectura, no como si una de las dos formas pudiera borrarse.', caution: 'Debe conservarse la evidencia textual y la tradición de lectura claramente diferenciadas.' },
  { id: 'tips', step: 16, label: 'Tips', title: 'Tips generales del curso', what: 'Aquí se reúnen únicamente ayudas prácticas del método del instructor, separadas de las reglas formales.', when: 'Úsalas para estudiar: práctica breve y frecuente, repetición fonética, escritura manual y aplicación en palabras reales.', tip: 'Practica planas, repasa entre semana y aplica inmediatamente lo aprendido en lectura contextual.' },
]

export default function GrammarNavigator() {
  const [open, setOpen] = useState<string | null>(null)
  const active = TOPICS.find(topic => topic.id === open) ?? null

  return (
    <section aria-label="Reglas del curso" className="mx-auto max-w-3xl text-center">
      <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-slate-500">Sigue el orden del curso. Abre únicamente el tema que quieres estudiar.</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {TOPICS.map(topic => {
          const selected = topic.id === open
          return (
            <button key={topic.id} type="button" onClick={() => setOpen(current => current === topic.id ? null : topic.id)} aria-expanded={selected} className={`flex min-h-[74px] flex-col items-center justify-center rounded-[18px] px-2 py-2.5 text-center transition active:scale-[0.98] ${selected ? 'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.18)]' : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80'}`}>
              <span className={`text-[9px] font-black ${selected ? 'text-indigo-100' : 'text-indigo-500'}`}>{topic.step}</span>
              {topic.he && <span lang="he" dir="rtl" className={`mt-0.5 text-[15px] font-black leading-none ${selected ? 'text-white' : 'text-indigo-700'}`}>{topic.he}</span>}
              <span className="mt-1 text-[10px] font-black leading-tight">{topic.label}</span>
            </button>
          )
        })}
      </div>

      {active && (
        <article className="mt-4 overflow-hidden rounded-[20px] bg-white text-left shadow-sm ring-1 ring-slate-200/80">
          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-indigo-500">Regla {active.step}</p>
                <h3 className="mt-1 text-[1.15rem] font-black leading-tight text-slate-950">{active.title}</h3>
              </div>
              <button type="button" onClick={() => setOpen(null)} aria-label="Cerrar regla" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400"><ChevronDown className="h-4 w-4 rotate-180" /></button>
            </div>

            <details className="mt-4 border-t border-slate-100 pt-3" open>
              <summary className="cursor-pointer list-none text-[11px] font-black text-slate-800">¿Qué es?</summary>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{active.what}</p>
            </details>
            <details className="mt-3 border-t border-slate-100 pt-3">
              <summary className="cursor-pointer list-none text-[11px] font-black text-slate-800">¿Cuándo y cómo se usa?</summary>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{active.when}</p>
            </details>
            {active.example && <details className="mt-3 border-t border-slate-100 pt-3"><summary className="cursor-pointer list-none text-[11px] font-black text-slate-800">Ejemplo</summary><p lang="he" dir="rtl" className="mt-3 text-center text-[2rem] font-black leading-tight text-indigo-700">{active.example}</p>{active.exampleEs && <p className="mt-1 text-center text-[11px] font-semibold text-slate-500">{active.exampleEs}</p>}</details>}
            {active.caution && <details className="mt-3 border-t border-slate-100 pt-3"><summary className="cursor-pointer list-none text-[11px] font-black text-slate-800">Importante</summary><p className="mt-2 text-[12px] leading-relaxed text-slate-600">{active.caution}</p></details>}
          </div>
          {active.tip && <div className="border-t border-amber-100 bg-amber-50/70 px-4 py-3"><p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-800"><Lightbulb className="h-3.5 w-3.5" />Tip del curso</p><p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-amber-900/80">{active.tip}</p></div>}
        </article>
      )}
    </section>
  )
}
