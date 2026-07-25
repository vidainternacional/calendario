export default function ShineSweep({ className = '' }: { className?: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`vida-shine-sweep pointer-events-none absolute inset-y-[-25%] -left-[62%] w-[58%] ${className}`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[1px]" />
        <span className="absolute inset-y-[12%] left-[46%] w-[8%] bg-white/95 blur-[0.5px] shadow-[0_0_24px_rgba(255,255,255,0.85)]" />
      </span>
      <style jsx global>{`
        @keyframes vida-shine-sweep {
          0%, 32% {
            transform: translate3d(-10%, 0, 0) skewX(-18deg);
            opacity: 0;
          }
          38% { opacity: 1; }
          72% {
            transform: translate3d(300%, 0, 0) skewX(-18deg);
            opacity: 1;
          }
          78%, 100% {
            transform: translate3d(325%, 0, 0) skewX(-18deg);
            opacity: 0;
          }
        }
        .vida-shine-sweep {
          animation: vida-shine-sweep 4.8s cubic-bezier(.2,.7,.2,1) infinite;
          will-change: transform, opacity;
          filter: drop-shadow(0 0 14px rgba(255,255,255,.5));
        }
        @media (prefers-reduced-motion: reduce) {
          .vida-shine-sweep { display: none !important; animation: none !important; }
        }
      `}</style>
    </>
  )
}
