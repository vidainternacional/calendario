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

      /*
       * Algunos botones nacen como acciones de texto y luego el menú circular
       * oculta esa etiqueta. Estas máscaras mantienen iconos reales visibles
       * sin alterar la acción, su aria-label ni el comportamiento de React.
       */
      [data-vida-verse-actions="true"] :is(
        [aria-label="Guardar"],
        [aria-label="Quitar"],
        [aria-label="Escuchar"],
        [aria-label="Estudiar"],
        [aria-label="Profundo"]
      )::before {
        content: "";
        display: block;
        width: 19px;
        height: 19px;
        flex: 0 0 19px;
        background-color: currentColor;
        -webkit-mask: var(--vida-action-icon) center / contain no-repeat;
        mask: var(--vida-action-icon) center / contain no-repeat;
      }

      [data-vida-verse-actions="true"] :is(
        [aria-label="Guardar"],
        [aria-label="Quitar"]
      )::before {
        --vida-action-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z'/%3E%3C/svg%3E");
      }

      [data-vida-verse-actions="true"] [aria-label="Escuchar"]::before {
        --vida-action-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M11 5 6 9H2v6h4l5 4V5Z'/%3E%3Cpath d='M15.54 8.46a5 5 0 0 1 0 7.07'/%3E%3Cpath d='M19.07 4.93a10 10 0 0 1 0 14.14'/%3E%3C/svg%3E");
      }

      [data-vida-verse-actions="true"] :is(
        [aria-label="Estudiar"],
        [aria-label="Profundo"]
      )::before {
        --vida-action-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m12 3-1.9 4.1L6 9l4.1 1.9L12 15l1.9-4.1L18 9l-4.1-1.9L12 3Z'/%3E%3Cpath d='M5 3v4M3 5h4M19 17v4M17 19h4'/%3E%3C/svg%3E");
      }
    `}</style>
  )
}
