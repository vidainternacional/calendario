export default function PastoralLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Cargando Centro Pastoral"
      className="mx-auto min-h-screen max-w-3xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7"
    >
      <div className="animate-pulse">
        <header className="mb-5">
          <div className="h-4 w-36 rounded-full bg-indigo-100" />
          <div className="mt-3 h-9 w-56 max-w-full rounded-xl bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-lg rounded-full bg-slate-200" />
        </header>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 sm:p-6">
            <div className="h-3 w-36 rounded-full bg-white/25" />
            <div className="mt-3 h-7 w-48 rounded-lg bg-white/35" />
            <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-white/20" />
            <div className="mt-2 h-4 w-3/4 max-w-md rounded-full bg-white/20" />
            <div className="mt-5 h-11 w-full rounded-xl bg-white/80 sm:w-48" />
          </div>

          <div className="p-4 sm:p-5">
            <div className="mb-5">
              <div className="h-5 w-40 rounded-full bg-slate-200" />
              <div className="mt-2 h-3 w-56 max-w-full rounded-full bg-slate-100" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-white" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-2/3 rounded-full bg-slate-200" />
                      <div className="mt-2 h-3 w-full rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={`flex min-h-20 items-center gap-3 bg-white p-4 ${index > 0 ? 'border-t border-slate-100' : ''}`}>
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-28 rounded-full bg-slate-200" />
                    <div className="mt-2 h-3 w-full rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-white" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-16 rounded-full bg-slate-200" />
                    <div className="mt-2 h-3 w-20 max-w-full rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <span className="sr-only">Cargando herramientas pastorales…</span>
    </main>
  )
}
