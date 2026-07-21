import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/** Procesa los enlaces de los correos (confirmar cuenta / recuperar contraseña). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  const redirigir = (ruta: string) => NextResponse.redirect(new URL(ruta, request.url))

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      if (type === 'recovery') return redirigir(next || '/restablecer')
      return redirigir('/pendiente') // cuenta confirmada → sala de espera (o /inicio si ya está activa)
    }
  }
  return redirigir('/login?error=enlace')
}
