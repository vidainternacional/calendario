import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas públicas — no requieren autenticación
  const publicRoutes = ['/', '/login', '/signup', '/api/icon', '/auth/confirm', '/olvide']
  const isPublicRoute = publicRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/inicio'
    return NextResponse.redirect(url)
  }

  // ── Guardia de estado de cuenta ──────────────────────────────
  // Usuarios no-activos (pendiente/suspendido/rechazado) solo
  // pueden ver /pendiente. Usuarios activos no tienen nada que
  // hacer en /pendiente.
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('estado_cuenta')
      .eq('id', user.id)
      .single<{ estado_cuenta: string }>()

    const estado = profile?.estado_cuenta ?? 'pendiente'

    if (estado !== 'activo' && pathname !== '/pendiente') {
      const url = request.nextUrl.clone()
      url.pathname = '/pendiente'
      return NextResponse.redirect(url)
    }

    if (estado === 'activo' && pathname === '/pendiente') {
      const url = request.nextUrl.clone()
      url.pathname = '/inicio'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
