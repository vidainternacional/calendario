import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - manifest.json
     * - sw.js (service worker)
     * - biblia/notas-offline (shell React estático, sin datos privados remotos)
     * - offline/notas.html (shell histórico; ya no es fallback activo)
     * - icons/
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|biblia/notas-offline|offline/notas\\.html|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
