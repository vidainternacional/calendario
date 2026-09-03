import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Centro de Ayuda' }

export default function PastoralAyudaSolidariaPage() {
  redirect('/ayuda-solidaria')
}
