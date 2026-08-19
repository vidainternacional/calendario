'use client'

import { useLayoutEffect, useState } from 'react'
import BibleNotesWorkspace from '@/components/biblia/BibleNotesWorkspace'
import OfflineNotesOwnerMarker, {
  VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY,
} from '@/components/biblia/OfflineNotesOwnerMarker'
import { resolverUsuarioActualNotas } from '@/lib/biblia/notes-sync'

const OWNER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type OwnerState = string | null | undefined

export default function OfflineBibleNotesWorkspace() {
  const [ownerId, setOwnerId] = useState<OwnerState>(undefined)

  useLayoutEffect(() => {
    let activo = true

    const resolver = async () => {
      let ownerLocal = ''
      try {
        ownerLocal = localStorage.getItem(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY) || ''
      } catch {}

      if (OWNER_UUID_RE.test(ownerLocal)) {
        if (activo) setOwnerId(ownerLocal)
        return
      }

      const ownerSesion = await resolverUsuarioActualNotas().catch(() => null)
      if (!activo) return
      if (ownerSesion && OWNER_UUID_RE.test(ownerSesion)) {
        setOwnerId(ownerSesion)
        return
      }

      // No inferimos identidad a partir de notas residuales del dispositivo.
      // Si el usuario cerró sesión, los datos privados locales no deben volver a
      // aparecer simplemente porque solo exista un propietario en localStorage.
      setOwnerId(null)
    }

    void resolver()
    return () => { activo = false }
  }, [])

  if (ownerId === undefined) {
    return <div className="min-h-[55vh] bg-[var(--background)] text-[var(--foreground)]" aria-hidden="true" />
  }

  if (!ownerId) {
    return (
      <main className="min-h-screen bg-[#f7f7f4] px-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] text-slate-900 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-[23px] font-extrabold tracking-[-0.025em]">Cuaderno</h1>
          <div className="mt-6 rounded-[22px] border border-white/80 bg-white/60 p-5 shadow-[0_4px_18px_rgba(15,23,42,0.055)] backdrop-blur-2xl">
            <p className="text-sm font-bold">Abre el Cuaderno una vez con conexión</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Así este dispositivo puede identificar de forma segura qué cuaderno local debe mostrar cuando no haya Internet.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <OfflineNotesOwnerMarker userId={ownerId} />
      <BibleNotesWorkspace userId={ownerId} />
    </>
  )
}
