'use client'

import { Fragment, useState } from 'react'
import { Lightbulb } from 'lucide-react'

type RuleTopic = { id:string; step:number; label:string; symbol:string; title:string; what:string; how:string; example?:string; exampleEs?:string; caution?:string; tip?:string }

const TOPICS: readonly RuleTopic[] = [
 {id:'sheva',step:1,label:'Sheva',symbol:'ְ',title:'Sheva',what:'Es este signo: ְ. Son dos puntitos verticales que aparecen debajo de una consonante.',how:'Puede indicar una vocal muy breve o que la consonante no lleva vocal. Por eso no debes pronunciarlo siempre de la misma manera.',example:'שְׁמַע',exampleEs:'Mira ְ debajo de שׁ en שְׁמַע (shemá).',caution:'Primero aprende a localizar el símbolo ְ. Después aprenderás a distinguir sus funciones según la sílaba.',tip:'Cuando busques un sheva, mira debajo de la letra: ְ.'},
 {id:'dagesh',step:2,label:'Dagesh',symbol:'ּ',title:'Dagesh',what:'Es un punto dentro de una consonante: ּ. No está debajo ni encima: está dentro de la letra.',how:'En בּ, כּ y פּ es muy fácil notar su efecto: בּ = b frente a ב = v; כּ = k frente a כ = j/kh; פּ = p frente a פ = f.',example:'בּ · כּ · פּ',exampleEs:'El punto interior ּ es lo que debes localizar.',caution:'Hay más de un tipo de dagesh. Primero reconoce visualmente el punto y su efecto básico; las funciones gramaticales vienen después.',tip:'Pregunta rápida: ¿el punto está dentro de la letra? Entonces puede ser dagesh.'},
 {id:'shin-sin',step:3,label:'Shin / Sin',symbol:'שׁ · שׂ',title:'Shin y Sin',what:'La letra ש usa un punto superior para indicarte cómo leerla.',how:'שׁ tiene el punto arriba a la derecha y suena sh. שׂ tiene el punto arriba a la izquierda y suena s.',example:'שׁ = sh   ·   שׂ = s',tip:'Antes de leer ש, mira de qué lado está el punto.'},
 {id:'syllables',step:4,label:'Sílabas',symbol:'בָּ + רָ',title:'Formar sílabas',what:'Una palabra se vuelve más fácil cuando dejas de verla como un bloque y unes consonante + vocal.',how:'Reconoce la consonante, mira su vocal y pronuncia ese pequeño bloque. Después une los bloques.',example:'בָּ + רָ + א',exampleEs:'ba · ra → bará',tip:'Lento y correcto primero; la velocidad llega sola con práctica.'},
 {id:'matres',step:5,label:'Matres',symbol:'א ה ו י',title:'Matres lectionis',what:'א ה ו י son consonantes, pero en ciertos lugares también ayudan a representar o sostener una vocal.',how:'No las memorices como vocales nuevas. Observa qué función cumplen dentro de cada palabra.',example:'אוֹר · תּוֹרָה · שִׁיר',caution:'La función depende de la posición y de la escritura de la palabra.'},
 {id:'article',step:6,label:'Artículo',symbol:'הַ',title:'Artículo definido',what:'הַ se pega al inicio de una palabra y normalmente aporta la idea de el, la, los o las.',how:'Busca הַ al comienzo. Después separa mentalmente el artículo de la palabra principal.',example:'הַדָּבָר',exampleEs:'ha-davár · la palabra / la cosa',caution:'Con algunas consonantes la vocalización cambia. Empieza dominando la forma básica הַ.'},
 {id:'prefixes',step:7,label:'Prefijos',symbol:'בְּ לְ כְּ וְ',title:'Prefijos inseparables',what:'Son pequeñas piezas que aparecen pegadas al comienzo de otra palabra.',how:'בְּ suele expresar en/con; לְ a/para; כְּ como; וְ normalmente conecta con y. Separa primero la pieza y luego reconoce la base.',example:'בְּרֵאשִׁית · לְאִישׁ',exampleEs:'en el principio · a/para un hombre',tip:'Lee por capas: prefijo primero, palabra después.'},
 {id:'gender',step:8,label:'Género',symbol:'־ָה',title:'Género',what:'El hebreo distingue formas masculinas y femeninas. Algunas terminaciones funcionan como pistas visuales.',how:'־ָה aparece con frecuencia en formas femeninas. Úsala como pista, no como una fórmula infalible.',example:'טוֹב · טוֹבָה',exampleEs:'tov · tová · bueno / buena',caution:'Hay excepciones; el género se confirma por la palabra y el contexto.'},
 {id:'number',step:9,label:'Número',symbol:'־ִים · ־וֹת',title:'Número',what:'El singular y el plural pueden reconocerse muchas veces por terminaciones visibles.',how:'־ִים aparece frecuentemente en masculino plural y ־וֹת en femenino plural.',example:'טוֹבִים · טוֹבוֹת',exampleEs:'tovím · tovót',caution:'Las terminaciones son pistas y existen excepciones.'},
 {id:'suffixes',step:10,label:'Sufijos',symbol:'…־ךָ · …־וֹ',title:'Sufijos',what:'Un sufijo es una pieza añadida al final de una palabra.',how:'Puede aportar persona, género, número o una relación pronominal. Primero identifica la base; luego mira qué se añadió al final.',caution:'La base puede cambiar ligeramente al recibir el sufijo.'},
 {id:'possession',step:11,label:'Posesión',symbol:'…־י · …־ךָ · …־וֹ',title:'Posesión',what:'En hebreo la idea de mi, tu o su puede aparecer pegada al final de una palabra.',how:'No busques siempre un pronombre separado. Mira la terminación y también la construcción completa.'},
 {id:'construct',step:12,label:'Constructo',symbol:'X + Y',title:'Cadena constructa',what:'Dos nombres pueden formar una unidad para expresar una relación que en español suele decirse con de.',how:'El primer nombre queda unido al segundo y a veces cambia de forma.',example:'בֵּית הַמֶּלֶךְ',exampleEs:'beit ha-mélej · la casa del rey',caution:'La definitud de toda la cadena depende del segundo elemento.'},
 {id:'roots',step:13,label:'Raíces',symbol:'כתב',title:'Raíces',what:'Muchas palabras hebreas pertenecen a familias que pueden estudiarse alrededor de una raíz consonántica.',how:'Quita mentalmente piezas conocidas como prefijos y sufijos y observa qué consonantes forman la base.',caution:'Una raíz debe verificarse; no se decide solo porque tres letras se parezcan.',tip:'Desarma por capas: prefijo → base → sufijo.'},
 {id:'verbs',step:14,label:'Verbos',symbol:'אָמַר',title:'Verbos',what:'Un verbo cambia de forma para comunicar quién participa y cómo se presenta la acción.',how:'Empieza reconociendo el lema y las piezas que cambian. Después estudia qatal, yiqtol, imperativo, participio y las formas secuenciales.',example:'אָמַר · יֹאמַר · אֱמֹר',exampleEs:'amár · yomár · emór',caution:'No reduzcas qatal a pasado ni yiqtol a futuro automáticamente; el contexto importa.'},
 {id:'qere-ketiv',step:15,label:'Qere / Ketiv',symbol:'קְרֵי / כְּתִיב',title:'Qere / Ketiv',what:'En algunos lugares el texto masorético conserva una forma escrita y una tradición de lectura.',how:'Ketiv identifica lo escrito; Qere indica la lectura transmitida. Mantén ambas informaciones diferenciadas.',caution:'No se debe borrar una para reemplazarla por la otra.'},
 {id:'tips',step:16,label:'Tips',symbol:'💡',title:'Tips del curso',what:'Aquí van las ayudas prácticas del instructor, separadas de las reglas formales.',how:'Úsalas como método de estudio: práctica breve y frecuente, repetición fonética, escritura manual y lectura de palabras reales.',tip:'Practica planas, repasa entre semana y aplica inmediatamente lo aprendido.'},
]

function RuleCard({topic,onClose}:{topic:RuleTopic;onClose:()=>void}) {
 return <article className="col-span-3 overflow-hidden rounded-[20px] bg-white text-left shadow-sm ring-1 ring-indigo-200">
   <div className="px-4 py-4">
    <div className="text-center"><p className="text-[9px] font-black uppercase tracking-[.1em] text-indigo-500">Regla {topic.step}</p><div className="mt-2 flex min-h-[74px] items-center justify-center rounded-[16px] bg-indigo-50 px-3"><span dir="rtl" className="text-[3rem] font-black leading-none text-indigo-700">{topic.symbol}</span></div><h3 className="mt-3 text-[1.15rem] font-black text-slate-950">{topic.title}</h3></div>
    <details className="mt-4 border-t border-slate-100 pt-3" open><summary className="cursor-pointer list-none text-[11px] font-black text-slate-800">¿Qué estoy viendo?</summary><p className="mt-2 text-[12px] leading-relaxed text-slate-600">{topic.what}</p></details>
    <details className="mt-3 border-t border-slate-100 pt-3"><summary className="cursor-pointer list-none text-[11px] font-black text-slate-800">¿Cómo funciona?</summary><p className="mt-2 text-[12px] leading-relaxed text-slate-600">{topic.how}</p></details>
    {topic.example&&<details className="mt-3 border-t border-slate-100 pt-3"><summary className="cursor-pointer list-none text-[11px] font-black text-slate-800">Verlo en una palabra</summary><p lang="he" dir="rtl" className="mt-3 text-center text-[2rem] font-black text-indigo-700">{topic.example}</p>{topic.exampleEs&&<p className="mt-1 text-center text-[11px] font-semibold text-slate-500">{topic.exampleEs}</p>}</details>}
    {topic.caution&&<details className="mt-3 border-t border-slate-100 pt-3"><summary className="cursor-pointer list-none text-[11px] font-black text-slate-800">Importante</summary><p className="mt-2 text-[12px] leading-relaxed text-slate-600">{topic.caution}</p></details>}
    <button type="button" onClick={onClose} className="mt-4 w-full text-center text-[10px] font-black text-slate-400">Cerrar ficha</button>
   </div>
   {topic.tip&&<div className="border-t border-amber-100 bg-amber-50/70 px-4 py-3"><p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.08em] text-amber-800"><Lightbulb className="h-3.5 w-3.5"/>Tip del curso</p><p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-amber-900/80">{topic.tip}</p></div>}
 </article>
}

export default function GrammarNavigator(){
 const [open,setOpen]=useState<string|null>(null)
 return <section aria-label="Reglas del curso" className="mx-auto max-w-3xl text-center">
  <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-slate-500">Sigue el orden del curso. Toca una ficha para aprender la regla.</p>
  <div className="mt-4 grid grid-cols-3 gap-2">
   {TOPICS.map((topic,index)=>{
    const selected=open===topic.id
    const endOfRow=(index%3===2)||(index===TOPICS.length-1)
    return <Fragment key={topic.id}>
     <button type="button" onClick={()=>setOpen(current=>current===topic.id?null:topic.id)} aria-expanded={selected} className={`flex min-h-[88px] flex-col items-center justify-center rounded-[18px] px-1.5 py-2 text-center transition active:scale-[.98] ${selected?'bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,.18)]':'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80'}`}>
      <span className={`text-[9px] font-black ${selected?'text-indigo-100':'text-indigo-500'}`}>{topic.step}</span><span dir="rtl" className={`mt-1 block max-w-full text-[1.35rem] font-black leading-none ${selected?'text-white':'text-indigo-700'}`}>{topic.symbol}</span><span className="mt-1.5 text-[10px] font-black leading-tight">{topic.label}</span>
     </button>
     {selected&&endOfRow&&<RuleCard topic={topic} onClose={()=>setOpen(null)}/>} 
     {endOfRow&&open&&TOPICS.slice(index-(index%3),index+1).some(item=>item.id===open)&&!selected&&<RuleCard topic={TOPICS.find(item=>item.id===open)!} onClose={()=>setOpen(null)}/>} 
    </Fragment>
   })}
  </div>
 </section>
}
