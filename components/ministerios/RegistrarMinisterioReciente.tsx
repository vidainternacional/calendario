'use client'

import { useEffect } from 'react'
import { registrarMinisterioReciente } from '@/lib/ministerios/ministerio-reciente'

/** Se monta después de autorizar el acceso y comprobar membresía; un prefetch no registra visitas. */
export default function RegistrarMinisterioReciente({ usuarioId, ministerioId }: { usuarioId: string; ministerioId: string }) {
  useEffect(() => { registrarMinisterioReciente(usuarioId, ministerioId) }, [usuarioId, ministerioId])
  return null
}
