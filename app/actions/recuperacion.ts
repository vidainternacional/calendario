'use server'

import { createClient } from '@/lib/supabase/server'

export async function solicitarRecuperacion(email: string) {
  if (!email?.includes('@')) return { error: 'Escribe un correo válido.' }
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email.trim())
  return { success: true } // respuesta neutra: no revelamos si el correo existe
}
