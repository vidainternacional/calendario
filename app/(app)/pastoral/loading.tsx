export default function PastoralLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Cargando Centro Pastoral"
      className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8"
    >
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded-full bg-indigo-100" />
        <div className="mt-4 h-9 w-64 max-w-full rounded-xl bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-slate-200" />

        <section className="mt-7 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-44 rounded-full bg-slate-200" />
              <div className="h-3 w-56 max-w-full rounded-full bg-slate-100" />
            </div>
            <div className="h-11 w-28 rounded-xl bg-indigo-100" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="min-h-[154px] rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <div className="h-10 w-10 rounded-xl bg-white" />
                <div className="mt-5 h-4 w-3/4 rounded-full bg-slate-200" />
                <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-3 w-2/3 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="h-5 w-48 rounded-full bg-slate-200" />
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="min-h-[126px] rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
                <div className="mt-4 h-4 w-2/3 rounded-full bg-slate-200" />
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </section>
      </div>
      <span className="sr-only">Cargando herramientas pastorales…</span>
    </main>
  )
}
