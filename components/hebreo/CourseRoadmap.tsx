const COURSE_STEPS = [
  { number: 1, title: 'Alef-Bet y Sofit', detail: '22 consonantes, dirección RTL y cinco formas finales.' },
  { number: 2, title: 'Dagesh y sonidos', detail: 'Bet/Vet, Kaf/Jaf, Pe/Fe y Shin/Sin dentro de palabras.' },
  { number: 3, title: 'Vocales A · E · I', detail: 'Consonante + signo vocálico → sílaba.' },
  { number: 4, title: 'Vocales O · U + Sheva', detail: 'Holam, Qubuts, Shuruq y Sheva Na/Naj.' },
  { number: 5, title: 'Lectura · Shemá', detail: 'Deuteronomio 6:4–5 con niqqud y después sin ayudas.' },
  { number: 6, title: 'Prefijos inseparables', detail: 'B · M · K · L, Vav conjuntiva y He artículo.' },
  { number: 7, title: 'Raíces y repaso', detail: 'Reconocer la estructura cuando la fuente la respalde y consolidar lo aprendido.' },
] as const

export default function CourseRoadmap() {
  return (
    <section aria-labelledby="hebrew-course-roadmap-title" className="mx-auto w-full max-w-5xl border-y border-slate-200 bg-[#f9f9fb] px-4 py-4 text-center sm:px-6">
      <p lang="he" dir="rtl" className="text-[12px] font-black text-indigo-700">דֶּרֶךְ הַלִּמּוּד</p>
      <h2 id="hebrew-course-roadmap-title" className="mt-0.5 text-[1.15rem] font-black text-slate-950">Ruta del curso</h2>
      <p className="mx-auto mt-1 max-w-xl text-[12px] leading-relaxed text-slate-500">Avanza en este orden. La práctica recomendada es breve y constante: 5–10 minutos al día.</p>

      <ol className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-left">
        {COURSE_STEPS.map(step => (
          <li key={step.number} className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-[12px] font-black text-white">{step.number}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-black text-slate-900">{step.title}</span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
