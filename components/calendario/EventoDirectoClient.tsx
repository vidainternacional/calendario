'use client'

import { useRouter } from 'next/navigation'
import CalendarioEventDetail from '@/components/calendario/CalendarioEventDetail'
import type { EventoCalendario } from '@/components/calendario/calendario-ios-types'

export default function EventoDirectoClient({ event }: { event: EventoCalendario }) {
  const router = useRouter()

  return (
    <CalendarioEventDetail
      event={event}
      backLabel="Inicio"
      backAriaLabel="Volver a Inicio"
      onClose={() => router.back()}
    />
  )
}
