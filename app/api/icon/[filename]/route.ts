import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  // Use a fresh admin client for this route to quickly read the setting
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let variant = 'dorado' // default fallback

  try {
    const { data } = await supabase
      .from('app_settings')
      .select('valor')
      .eq('clave', 'active_icon_variant')
      .single()

    if (data && data.valor) {
      variant = typeof data.valor === 'string' ? data.valor : data.valor
      // clean quotes if it was stored as '"dorado"'
      variant = variant.replace(/"/g, '')
    }
  } catch (err) {
    console.error('Error fetching icon variant:', err)
  }

  // Allowed variants to prevent path traversal
  const allowedVariants = ['dorado', 'blanco', 'rojo']
  if (!allowedVariants.includes(variant)) variant = 'dorado'

  const iconUrl = new URL(`/icons/variant-${variant}/${filename}`, request.url)
  
  return NextResponse.redirect(iconUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
