export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f4f5f9] max-w-lg mx-auto flex flex-col pt-8 px-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
          <div className="space-y-2">
            <div className="w-20 h-3 bg-slate-200 rounded animate-pulse"></div>
            <div className="w-32 h-4 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded bg-slate-200 animate-pulse"></div>
      </div>

      <div className="space-y-8">
        {/* Section 1 Skeleton */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-slate-200 animate-pulse"></div>
            <div className="w-40 h-5 bg-slate-200 rounded animate-pulse"></div>
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-[18px] p-4 flex gap-4 h-[90px]">
                <div className="w-12 h-full bg-slate-100 rounded-xl animate-pulse"></div>
                <div className="flex-1 flex flex-col justify-center space-y-3">
                  <div className="w-3/4 h-4 bg-slate-100 rounded animate-pulse"></div>
                  <div className="w-1/2 h-3 bg-slate-100 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 Skeleton */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-slate-200 animate-pulse"></div>
            <div className="w-48 h-5 bg-slate-200 rounded animate-pulse"></div>
          </div>
          
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-[18px] p-5 h-[140px] flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-4 bg-slate-100 rounded animate-pulse"></div>
                  <div className="w-20 h-3 bg-slate-100 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-slate-100 rounded animate-pulse"></div>
                  <div className="w-5/6 h-4 bg-slate-100 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                  <div className="w-5 h-5 rounded-full bg-slate-100 animate-pulse"></div>
                  <div className="w-24 h-3 bg-slate-100 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
