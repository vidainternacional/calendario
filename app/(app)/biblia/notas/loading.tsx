function Pulse({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block animate-pulse bg-slate-200/80 ${className}`} />
}

export default function LoadingCuaderno() {
  return (
    <main className="vida-cuaderno-loading bg-[#f7f7f4] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto max-w-4xl" role="status" aria-label="Cargando Cuaderno">
        <header className="mb-5 space-y-2.5">
          <Pulse className="h-6 w-32 rounded-full" />
          <Pulse className="h-3.5 w-56 max-w-[72vw] rounded-full" />
        </header>

        <section className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} className="h-10 rounded-full border border-slate-200 bg-white" />
            ))}
          </div>

          <div className="mt-3 flex gap-3 overflow-hidden">
            <span className="h-20 w-20 shrink-0 rounded-full bg-violet-100" />
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} className="h-20 w-20 shrink-0 rounded-full border border-slate-200 bg-white" />
            ))}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-5 flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className="h-10 flex-1 rounded-full border border-slate-200 bg-white" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <Pulse
                  key={index}
                  className={`h-4 rounded-full ${index % 3 === 2 ? 'w-3/4' : 'w-full'}`}
                />
              ))}
            </div>
          </div>
        </section>
        <span className="sr-only">Cargando Cuaderno…</span>
      </div>
    </main>
  )
}
