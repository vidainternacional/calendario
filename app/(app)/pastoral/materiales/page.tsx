import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Proyectos publicados' }

export default function MaterialesPastoralesPage() {
  redirect('/pastoral/paquetes?filtro=publicados')
}
