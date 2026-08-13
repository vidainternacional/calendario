import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'
import AuthFrame from '@/components/auth/AuthFrame'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const nextPath = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/inicio'

  return (
    <AuthFrame
      title="Bienvenido de nuevo"
      subtitle="Ingresa a tu cuenta para continuar con tu comunidad, tus ministerios y la Biblia."
    >
      <LoginForm nextPath={nextPath} />
    </AuthFrame>
  )
}
