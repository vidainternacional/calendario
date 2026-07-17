import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f4f5f9] px-4">
      {/* Glow de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-[18px] bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <svg
              className="w-7 h-7 text-[#171923]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#171923]">Vida Internacional</h1>
          <p className="mt-1 text-sm text-gray-500">
            Accede a tu cuenta de servidor
          </p>
        </div>

        {/* Card */}
        <div className="bg-white backdrop-blur-sm border border-slate-100 rounded-[18px] p-6 shadow-xl">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
