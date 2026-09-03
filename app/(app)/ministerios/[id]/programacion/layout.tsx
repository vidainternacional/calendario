'use client'

import { usePathname } from 'next/navigation'

export default function ProgramacionMinisterialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const esProgramacionPrincipal = /\/ministerios\/[^/]+\/programacion\/?$/.test(pathname)

  return (
    <div className={esProgramacionPrincipal ? 'programacion-alabanza-spacing' : ''}>
      {children}
      {esProgramacionPrincipal ? (
        <style>{`
          .programacion-alabanza-spacing > main {
            padding-top: calc(env(safe-area-inset-top) + 1.25rem) !important;
          }
          .programacion-alabanza-spacing > main > header {
            margin-bottom: 1rem !important;
            padding-top: 0 !important;
          }
        `}</style>
      ) : null}
    </div>
  )
}
