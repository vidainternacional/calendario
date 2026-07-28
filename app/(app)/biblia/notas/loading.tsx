export default function LoadingNotasBiblicas() {
  return (
    <div className="vida-notas-loading" role="status" aria-label="Abriendo notas bíblicas">
      <div className="vida-notas-loading__indicator" aria-hidden="true" />
      <style>{`
        .vida-notas-loading {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f7f7f4;
          color: #475569;
          transition: background-color 160ms ease, color 160ms ease;
        }

        .vida-notas-loading__indicator {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 3px solid rgba(124, 58, 237, 0.22);
          border-top-color: #7c3aed;
          animation: vida-notas-spin 700ms linear infinite;
        }

        html[data-biblia-tema='oscuro'] .vida-notas-loading {
          background: #020617;
          color: #cbd5e1;
        }

        html[data-biblia-tema='oscuro'] .vida-notas-loading__indicator {
          border-color: rgba(167, 139, 250, 0.24);
          border-top-color: #a78bfa;
        }

        html[data-biblia-tema='sepia'] .vida-notas-loading {
          background: #efe5d0;
          color: #493c2d;
        }

        html[data-biblia-tema='sepia'] .vida-notas-loading__indicator {
          border-color: rgba(124, 90, 43, 0.2);
          border-top-color: #7c5a2b;
        }

        @keyframes vida-notas-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .vida-notas-loading__indicator { animation: none; }
        }
      `}</style>
    </div>
  )
}
