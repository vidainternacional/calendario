import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const nextPath = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/inicio'

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f4f5f9] px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#171923]">Vida Internacional</h1>
          <p className="mt-1 text-sm text-gray-500">Accede a tu cuenta</p>
        </div>

        <div className="rounded-[18px] border border-slate-100 bg-slate-950 p-6 shadow-xl">
          <LoginForm nextPath={nextPath} />
        </div>
        <a href="/olvide" className="mb-3 mt-4 block text-center text-xs text-slate-500 hover:text-[#171923]">¿Olvidaste tu contraseña?</a>
      </div>
    </main>
  )
}