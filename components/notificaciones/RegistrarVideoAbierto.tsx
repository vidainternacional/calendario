'use client'

import { useEffect } from 'react'
import { registrarVideoAbierto } from './useVideosMinisteriales'

export default function RegistrarVideoAbierto({ usuarioId, id, publicadoEn }: { usuarioId: string; id: string; publicadoEn: string }) {
  useEffect(() => { void registrarVideoAbierto(usuarioId, id, publicadoEn) }, [usuarioId, id, publicadoEn])
  return null
}
