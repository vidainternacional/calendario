export default function LoadingBiblia() {
  return (
    <main className="vida-biblia-loading min-h-screen px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto max-w-4xl" role="status" aria-label="Cargando Biblia">
        <header className="mb-4 flex items-center gap-3">
          <span className="vida-biblia-loading__icon h-11 w-11 shrink-0 rounded-2xl bg-[#C0392B]" />
          <div className="space-y-2">
            <span className="vida-biblia-loading__line block h-5 w-24 rounded-full" />
            <span className="vida-biblia-loading__line block h-3 w-36 rounded-full" />
          </div>
        </header>

        <section className="vida-biblia-loading__panel overflow-hidden rounded-[26px] border shadow-sm">
          <div className="vida-biblia-loading__divider border-b p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className="vida-biblia-loading__control h-10 rounded-full border" />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className="vida-biblia-loading__tab h-10 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mx-auto mb-5 flex max-w-sm justify-between gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className="vida-biblia-loading__control h-12 flex-1 rounded-full border" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <span
                  key={index}
                  className="vida-biblia-loading__line block h-4 rounded-full"
                  style={{ width: index % 3 === 2 ? '72%' : '100%' }}
                />
              ))}
            </div>
          </div>
        </section>
        <span className="sr-only">Cargando contenido bíblico…</span>
      </div>

      <style>{`
        .vida-biblia-loading {
          --loader-panel: #ffffff;
          --loader-control: #ffffff;
          --loader-soft: #e2e8f0;
          --loader-line: #d7dce3;
          --loader-border: #e2e8f0;
          background: var(--background, #f7f7f4);
          color: var(--foreground, #0f172a);
          animation: none !important;
        }

        html[data-biblia-tema='sepia'] .vida-biblia-loading {
          --loader-panel: #fffaf0;
          --loader-control: #fff8e8;
          --loader-soft: #ead9b5;
          --loader-line: #dcc9a5;
          --loader-border: #dac8a5;
        }

        html[data-biblia-tema='oscuro'] .vida-biblia-loading {
          --loader-panel: #0f172a;
          --loader-control: #111827;
          --loader-soft: #1e293b;
          --loader-line: #273449;
          --loader-border: #1e293b;
        }

        html[data-vida-cuaderno-target='true'] .vida-biblia-loading {
          --loader-panel: #ffffff;
          --loader-control: #ffffff;
          --loader-soft: #e2e8f0;
          --loader-line: #d7dce3;
          --loader-border: #e2e8f0;
          background: #f7f7f4 !important;
          color: #0f172a !important;
          color-scheme: light !important;
        }

        html[data-vida-cuaderno-target='true'] .vida-biblia-loading__icon {
          background: #7c3aed !important;
        }

        .vida-biblia-loading__panel { background: var(--loader-panel); border-color: var(--loader-border); }
        .vida-biblia-loading__divider { border-color: var(--loader-border); }
        .vida-biblia-loading__control { background: var(--loader-control); border-color: var(--loader-border); }
        .vida-biblia-loading__tab { background: var(--loader-soft); }
        .vida-biblia-loading__line {
          background: var(--loader-line);
          animation: vida-biblia-pulse 1.2s ease-in-out infinite;
        }

        @keyframes vida-biblia-pulse {
          0%, 100% { opacity: 0.52; }
          50% { opacity: 0.9; }
        }

        @media (prefers-reduced-motion: reduce) {
          .vida-biblia-loading__line { animation: none; }
        }
      `}</style>
    </main>
  )
}
