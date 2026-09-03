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
            padding-top: calc(env(safe-area-inset-top) + 1rem) !important;
          }

          .programacion-alabanza-spacing > main > header {
            margin-bottom: 1rem !important;
            padding-top: 0 !important;
          }

          .programacion-alabanza-spacing > main > section:first-of-type {
            border-radius: 0 !important;
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .programacion-alabanza-spacing #dia-seleccionado {
            margin-top: 1.25rem !important;
            border-top: 1px solid rgb(226 232 240) !important;
            border-radius: 0 !important;
            background: transparent !important;
            padding: 1rem 0 0 !important;
            box-shadow: none !important;
          }

          .programacion-alabanza-spacing #dia-seleccionado > div {
            gap: 0 !important;
          }

          .programacion-alabanza-spacing #dia-seleccionado > div > div {
            border-radius: 0 !important;
            background: transparent !important;
            padding: 0.9rem 0 !important;
            box-shadow: none !important;
            border-bottom: 1px solid rgb(226 232 240) !important;
          }

          .programacion-alabanza-spacing #dia-seleccionado > details {
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border-top: 1px solid rgb(226 232 240) !important;
          }
        `}</style>
      ) : null}
    </div>
  )
}
