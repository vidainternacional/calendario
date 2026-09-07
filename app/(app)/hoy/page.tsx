import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Planes de lectura y devocionales' }

export default function HoyPage() {
  redirect('/hoy/planes')
}
