import type { Metadata } from 'next'
import SignupForm from '@/components/auth/SignupForm'
import AuthFrame from '@/components/auth/AuthFrame'

export const metadata: Metadata = {
  title: 'Crear cuenta',
}

import { catalogoRegistroSedes } from '@/lib/sedes/catalogo-registro'

export default async function SignupPage() {
  const sedes = await catalogoRegistroSedes()
  return (
    <AuthFrame
      title="Crea tu cuenta"
      subtitle="Únete a Vida Internacional y mantén en un solo lugar tu comunidad, tus ministerios y tus recursos."
      backHref="/login"
      backLabel="Iniciar sesión"
    >
      <SignupForm sedes={sedes} />
    </AuthFrame>
  )
}
