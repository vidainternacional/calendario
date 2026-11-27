import Link from 'next/link'
import type { BiblicalQuestionAnswer as Answer } from '@/lib/estudios/biblical-question-types'

export default function BiblicalQuestionAnswer({ answer }: { answer: Answer }) {
  return (
    <section aria-label="Respuesta a tu pregunta" className="space-y-4 px-1 py-2">
      <header>
        <h3 className="text-lg font-bold text-slate-950">{answer.status === 'answered' ? 'Respuesta a tu pregunta' : answer.status === 'clarify' ? 'Una aclaración para responderte mejor' : 'Pasajes para tu pregunta'}</h3>
        {answer.status === 'answered' && <p className="mt-1 text-xs leading-5 text-slate-500">Explicación asistida por IA basada en los pasajes indicados. Puedes abrirlos y revisar su contexto.</p>}
      </header>
      {answer.status === 'answered' && answer.paragraphs.map((paragraph, index) => (
        <div key={index} className="space-y-2">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{paragraph.text}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">{paragraph.citations.map(id => {
            const source = answer.sources.find(item => item.id === id)
            return source ? <Link key={id} href={`/biblia?book=${source.bookCode}&chapter=${source.chapter}&verse=${source.verse}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-[#A93226] underline decoration-red-200 underline-offset-4">{source.reference}</Link> : null
          })}</div>
        </div>
      ))}
      {answer.status === 'clarify' && <p className="text-[15px] leading-7 text-slate-700">{answer.question}</p>}
      {answer.status === 'unconfigured' && <p className="text-sm leading-6 text-slate-600">Encontramos estos pasajes, pero la explicación con IA todavía no está habilitada. No se ha generado una respuesta.</p>}
      {answer.status === 'unavailable' && <p className="text-sm leading-6 text-slate-600">No pudimos preparar una explicación respaldada en este momento. Conservamos los pasajes para que puedas revisarlos.</p>}
      {answer.status === 'insufficient' && <p className="text-sm leading-6 text-slate-600">No recuperamos evidencia suficiente para explicar toda la pregunta. Puedes precisar el tema o indicar un pasaje.</p>}
      {answer.sources.length > 0 && <details className="border-t border-slate-200 pt-3">
        <summary className="cursor-pointer py-2 text-sm font-semibold text-slate-700">Ver los pasajes utilizados · {answer.sources.length}</summary>
        <div className="mt-3 space-y-5">{answer.sources.map(source => <div key={source.id}>
          <Link href={`/biblia?book=${source.bookCode}&chapter=${source.chapter}&verse=${source.verse}`} className="inline-flex min-h-10 items-center text-sm font-bold text-[#A93226]">{source.reference}</Link>
          <p className="text-sm leading-6 text-slate-700">{source.text}</p>
          <p className="mt-1 text-xs text-slate-500">{source.sourceName}</p>
          <Link href={`/estudios/profundo?q=${encodeURIComponent(source.reference)}&auto=1`} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-[#A93226]">Ver estudio completo de {source.reference}</Link>
        </div>)}</div>
      </details>}
    </section>
  )
}
