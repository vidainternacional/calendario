import type { Metadata } from 'next'
import SignupForm from '@/components/auth/SignupForm'
import AuthFrame from '@/components/auth/AuthFrame'

export const metadata: Metadata = {
  title: 'Crear cuenta',
}

export default function SignupPage() {
  return (
    <AuthFrame
      title="Crea tu cuenta"
      subtitle="Únete a Vida Internacional y mantén en un solo lugar tu comunidad, tus ministerios y tus recursos."
      backHref="/login"
      backLabel="Iniciar sesión"
    >
      <SignupForm />
    </AuthFrame>
  )
}
