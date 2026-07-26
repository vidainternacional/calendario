export default function MobileTablePolish() {
  return (
    <style>{`
      @media (max-width: 767px) {
        [data-mobile-table-scope="true"] table {
          display: block;
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overscroll-behavior-inline: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          touch-action: pan-x pan-y;
        }

        [data-mobile-table-scope="true"] table th,
        [data-mobile-table-scope="true"] table td {
          max-width: min(72vw, 22rem);
          padding: 0.75rem;
          overflow-wrap: anywhere;
          word-break: normal;
          vertical-align: middle;
        }

        [data-mobile-table-scope="true"] table th {
          white-space: nowrap;
        }

        [data-mobile-table-scope="true"] table :where(button, [role="button"]) {
          min-width: 2.75rem;
          min-height: 2.75rem;
          touch-action: manipulation;
        }

        [data-mobile-table-scope="true"] :where(.overflow-x-auto, [class*="overflow-x-scroll"]) {
          overscroll-behavior-inline: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
      }
    `}</style>
  )
}
