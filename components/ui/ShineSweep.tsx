export default function ShineSweep({ className = '' }: { className?: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`vida-shine-sweep pointer-events-none absolute inset-y-[-30%] -left-[70%] w-[62%] ${className}`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[1px]" />
        <span className="absolute inset-y-[-8%] left-[45%] w-[9%] bg-white/95 blur-[0.5px] shadow-[0_0_28px_rgba(255,255,255,0.9)]" />
      </span>
      <style jsx global>{`
        @keyframes vida-shine-sweep {
          0%, 26% { transform: translate3d(-10%, 0, 0) skewX(-18deg); opacity: 0; }
          32% { opacity: 1; }
          66% { transform: translate3d(292%, 0, 0) skewX(-18deg); opacity: 1; }
          72%, 100% { transform: translate3d(318%, 0, 0) skewX(-18deg); opacity: 0; }
        }
        .vida-shine-sweep {
          animation: vida-shine-sweep 4.6s cubic-bezier(.2,.72,.22,1) infinite;
          filter: drop-shadow(0 0 16px rgba(255,255,255,.58));
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .vida-shine-sweep { display: none !important; animation: none !important; }
        }
      `}</style>
    </>
  )
}
