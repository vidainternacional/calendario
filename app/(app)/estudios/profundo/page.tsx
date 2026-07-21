import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EstudioProfundoClient from '@/components/estudios/EstudioProfundoClient'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estudio Profundo (IA)',
}

export default async function EstudioProfundoPage({ searchParams }: { searchParams: Promise<{ pasaje?: string }> }) {
  const { pasaje } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="px-4 py-8 max-w-4xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/estudios" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#171923] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a Estudios
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-[#C0392B]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#171923]">Estudio Profundo</h1>
            <p className="text-sm text-slate-500 mt-1">
              Análisis académico integral impulsado por IA
            </p>
          </div>
        </div>
      </div>

      <EstudioProfundoClient {...({ initialPasaje: pasaje ?? '' } as Record<string, string>)} />
    </main>
  )
}
