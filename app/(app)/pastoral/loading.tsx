export default function PastoralLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Cargando Centro Pastoral"
      className="pastoral-workspace mx-auto min-h-screen max-w-3xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7"
    >
      <div className="animate-pulse">
        <div className="pastoral-workspace-back">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
        </div>

        <header className="pastoral-workspace-header">
          <div className="pastoral-eyebrow">
            <span className="h-4 w-4 rounded bg-violet-200" />
            <span className="h-3 w-24 rounded-full bg-violet-100" />
          </div>
          <div className="pastoral-workspace-heading">
            <div className="h-8 w-44 max-w-[65vw] rounded-lg bg-slate-200" />
            <div className="h-6 w-24 rounded-full bg-violet-100" />
          </div>
        </header>

        <section className="pastoral-project" aria-label="Cargando proyecto pastoral">
          <div className="pastoral-section-label">
            <span className="h-4 w-4 rounded bg-slate-200" />
            <span className="h-3 w-16 rounded-full bg-slate-200" />
          </div>

          <div className="pastoral-current-project">
            <span className="pastoral-current-project-icon">
              <span className="block h-5 w-5 rounded bg-violet-200" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="h-4 w-36 max-w-[45vw] rounded-full bg-slate-200" />
                <span className="h-5 w-14 rounded-full bg-slate-100" />
              </span>
              <span className="mt-2 block h-3 w-28 rounded-full bg-slate-100" />
            </span>
            <span className="h-4 w-4 rounded bg-slate-100" />
          </div>

          <div className="pastoral-primary-action pointer-events-none">
            <span className="h-4 w-4 rounded bg-white/45" />
            <span className="h-3 w-24 rounded-full bg-white/45" />
          </div>
        </section>

        <nav className="grid grid-cols-3 gap-x-3 gap-y-5 py-6 sm:grid-cols-4" aria-label="Cargando herramientas pastorales">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl px-1 text-center">
              <div className="h-7 w-7 rounded-lg bg-slate-200" />
              <div className="h-3 w-16 max-w-full rounded-full bg-slate-200" />
            </div>
          ))}
        </nav>
      </div>
      <span className="sr-only">Cargando herramientas pastorales…</span>
    </main>
  )
}
