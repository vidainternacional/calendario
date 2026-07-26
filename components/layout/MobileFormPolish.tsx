export default function MobileFormPolish() {
  return (
    <style>{`
      @media (max-width: 767px) {
        [data-mobile-form-scope="true"] :where(form, fieldset, label, .grid, .flex) {
          min-width: 0;
          max-width: 100%;
        }

        [data-mobile-form-scope="true"] :where(input, textarea, select) {
          width: 100%;
          max-width: 100%;
          min-height: 2.75rem;
          font-size: 16px;
          line-height: 1.4;
        }

        [data-mobile-form-scope="true"] textarea {
          min-height: 7rem;
          resize: vertical;
        }

        [data-mobile-form-scope="true"] select {
          text-overflow: ellipsis;
        }

        [data-mobile-form-scope="true"] :where(label, legend) {
          overflow-wrap: anywhere;
        }

        [data-mobile-form-scope="true"] :where(button, [role="button"], a[href]) {
          min-height: 2.75rem;
          touch-action: manipulation;
        }

        [data-mobile-form-scope="true"] :where(input, textarea, select, button):focus-visible {
          scroll-margin-top: 6rem;
          scroll-margin-bottom: 7rem;
        }

        [data-mobile-form-scope="true"] :where(.grid-cols-2, .grid-cols-3, .grid-cols-4):not([class*="sm:grid-cols-"]):not([class*="md:grid-cols-"]) {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `}</style>
  )
}
