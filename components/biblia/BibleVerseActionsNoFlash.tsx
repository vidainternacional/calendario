'use client'

export default function BibleVerseActionsNoFlash() {
  return (
    <style>{`
      /* Nunca mostrar el menú legado ni estados intermedios. */
      [id^="versiculo-"] > div[class*="grid-cols-2"][class*="rounded-2xl"],
      [id^="versiculo-"] > [data-vida-verse-actions="true"] {
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Mostrar únicamente el menú circular completamente terminado. */
      [id^="versiculo-"] > [data-vida-verse-actions="true"][data-vida-icons-ready="true"] {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    `}</style>
  )
}