'use client'

import { useEffect, useState } from 'react'
import { BookOpenText, ChevronDown } from 'lucide-react'
import { authorshipCatalogVersion, getBookAuthorship } from '@/lib/biblia/book-authorship'

function selectedBookName() {
  const select = document.querySelector<HTMLSelectElement>('select[aria-label="Libro de la Biblia"]')
  return select?.selectedOptions[0]?.textContent?.trim() || ''
}

export default function BibleBookAuthorship() {
  const [bookName, setBookName] = useState('')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const sync = () => setBookName(selectedBookName())
    const frame = window.requestAnimationFrame(sync)

    const handleChange = (event: Event) => {
      const target = event.target
      if (target instanceof HTMLSelectElement && target.getAttribute('aria-label') === 'Libro de la Biblia') sync()
    }

    document.addEventListener('change', handleChange)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('change', handleChange)
    }
  }, [])

  const authorship = getBookAuthorship(bookName)
  if (!authorship) return null

  return (
    <aside className="mx-auto -mb-1 mt-2 max-w-4xl px-4 sm:px-6" aria-label={`Autoría de ${authorship.book}`}>
      <div className="overflow-hidden rounded-2xl border border-indigo-200/70 bg-indigo-50/95 text-indigo-950 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-50">
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white"><BookOpenText className="h-4 w-4" /></span>
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-indigo-500">Autoría de {authorship.book}</span>
              <span className="mt-0.5 block text-sm font-bold leading-5">{authorship.attribution}</span>
            </span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="border-t border-indigo-200/70 px-4 py-3 text-xs leading-5 text-indigo-800 dark:border-indigo-800 dark:text-indigo-200">
            <p>{authorship.note}</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-70">Síntesis editorial con atribución responsable · {authorshipCatalogVersion}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
