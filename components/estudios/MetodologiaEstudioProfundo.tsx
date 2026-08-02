import {
  BookMarked,
  CheckCircle2,
  ChevronDown,
  Database,
  FileSearch,
  Layers3,
  Scale,
  ShieldCheck,
} from 'lucide-react'

const NIVELES = [
  {
    title: 'Breve',
    description: 'Resumen, contexto esencial, mensaje central y reflexión.',
  },
  {
    title: 'Completo',
    description: 'Texto, traducciones, contexto, palabras clave e interpretación responsable.',
  },
  {
    title: 'Avanzado',
    description: 'Variantes, manuscritos, estructura literaria, debates y perspectivas opcionales.',
  },
]

const METODOLOGIA = [
  'Texto original y transliteración precisa.',
  'Traducción literal y traducción interpretativa diferenciadas.',
  'Comparación de traducciones y variantes relevantes.',
  'Contexto histórico, cultural, político y religioso.',
  'Palabras clave, raíces, expresiones idiomáticas y metáforas.',
  'Estructura literaria, repeticiones, paralelismos y quiasmos.',
  'Intención probable del autor en su contexto.',
  'Lectura teológica y reflexión espiritual identificadas como tales.',
  'Afirmaciones que el pasaje no hace e interpretaciones comunes que requieren corrección.',
  'Debates académicos, límites de la evidencia y nivel de certeza.',
]

const REGLAS = [
  'No construir significados únicamente con números Strong.',
  'No presentar hipótesis como hechos ni variantes como corrupción intencional sin evidencia.',
  'No usar Cábala, gematría, Midrash o tradición posterior como sustituto del contexto original.',
  'No prometer milagros, profecías personales ni respuestas divinas.',
  'Decir expresamente cuando la biblioteca no contiene evidencia suficiente.',
]

export default function MetodologiaEstudioProfundo() {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
            <BookMarked className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">Biblioteca primero</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">Estudio bíblico profundo y verificable</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              El contenido principal debe provenir de fuentes internas aprobadas. La asistencia automática solo organiza información disponible y nunca sustituye la evidencia, la fuente ni la revisión humana.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {NIVELES.map((nivel) => (
            <article key={nivel.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-bold text-white">{nivel.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{nivel.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <Database className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-bold text-emerald-950">Disponible y aprobado</h3>
          <p className="mt-1 text-xs leading-5 text-emerald-800">
            Fuentes registradas, contexto histórico inicial y piloto léxico con procedencia, licencia, localizador, versión y hash.
          </p>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Layers3 className="h-5 w-5 text-amber-700" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-bold text-amber-950">Incorporación gradual</h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Manuscritos, traducciones antiguas, literatura histórica, mapas y cronologías se habilitarán únicamente tras validar licencia, integridad y alcance.
          </p>
        </article>

        <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <FileSearch className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h3 className="mt-3 text-sm font-bold text-sky-950">Respuesta honesta</h3>
          <p className="mt-1 text-xs leading-5 text-sky-800">
            Cuando una afirmación no esté respaldada por la biblioteca, el sistema debe reconocer el límite en lugar de completar el vacío con una respuesta convincente.
          </p>
        </article>
      </div>

      <div className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
        <details className="group rounded-2xl border border-slate-200 bg-slate-50">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-800 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2"><Scale className="h-4 w-4 text-[#C0392B]" /> Metodología académica</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-200 px-4 py-4">
            <ol className="grid gap-2 sm:grid-cols-2">
              {METODOLOGIA.map((item, index) => (
                <li key={item} className="flex gap-2 text-xs leading-5 text-slate-600">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-black text-[#C0392B] ring-1 ring-slate-200">{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </details>

        <details className="group rounded-2xl border border-slate-200 bg-slate-50">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-800 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#C0392B]" /> Reglas de honestidad</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-200 px-4 py-4">
            <ul className="space-y-2">
              {REGLAS.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-5 text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </section>
  )
}
