'use client'

export default function BibleVerseActionsNoFlash() {
  return (
    <style>{`
      /* Oculta el menú rectangular original antes del primer pintado. */
      [id^="versiculo-"] > div.mt-1.grid.grid-cols-2,
      [id^="versiculo-"] > div.mb-3.mt-1.grid.grid-cols-2 {
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Solo se muestra cuando ya fue convertido al menú circular definitivo. */
      [id^="versiculo-"] > [data-vida-verse-actions="true"] {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    `}</style>
  )
}
