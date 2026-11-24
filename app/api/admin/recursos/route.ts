import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResourceUsage } from '@/lib/admin/resource-usage'

export const dynamic = 'force-dynamic'

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' }
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://lnkrojvyiwnlcoponxud.supabase.co') {
    return NextResponse.json({ error: 'La medición requiere la conexión principal ccvida.' }, { status: 503, headers })
  }
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401, headers })
  const { data: profile, error: profileError } = await supabase.from('profiles').select('rol,estado_cuenta').eq('id', user.id).single()
  const account = profile as { rol?: string; estado_cuenta?: string } | null
  if (profileError || account?.rol !== 'administrador' || account?.estado_cuenta !== 'activo') {
    return NextResponse.json({ error: 'Solo administradores activos.' }, { status: 403, headers })
  }
  return NextResponse.json({ resources: await getResourceUsage() }, { headers })
}
