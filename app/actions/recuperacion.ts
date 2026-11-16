'use server'

import { createClient as createAuthClient } from '@supabase/supabase-js'

// La plantilla estándar de Supabase usa ConfirmationURL. El enlace de
// recuperación vuelve a esta página con los tokens en el fragmento (#).
// El flujo implícito permite abrir el correo desde otro navegador/teléfono
// sin depender de un verificador PKCE guardado en el navegador de origen.
const URL_RECUPERACION = process.env.VERCEL_ENV === 'preview'
  ? 'https://calendario-git-agent-devocionales-cen-bd65af-vida-internacional.vercel.app/restablecer'
  : 'https://calendario-vida-internacional.vercel.app/restablecer'

export async function solicitarRecuperacion(email: string) {
  const direccion = typeof email === 'string' ? email.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(direccion)) {
    return { error: 'Escribí un correo válido.' }
  }

  const supabase = createAuthClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  )

  const { error } = await supabase.auth.resetPasswordForEmail(direccion, {
    redirectTo: URL_RECUPERACION,
  })

  // Respuesta neutra: nunca revelar si la dirección está registrada.
  if (error) {
    return {
      error: /rate.limit|too many/i.test(error.message)
        ? 'Se alcanzó el límite temporal de correos. Probá nuevamente más tarde.'
        : 'No se pudo solicitar el enlace ahora. Intentá nuevamente.',
    }
  }
  return { success: true }
}
