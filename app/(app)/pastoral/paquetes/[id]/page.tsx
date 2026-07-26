import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PaqueteDetalleClient from '@/components/pastoral/PaqueteDetalleClient'
import PastoralWorkspaceBridge from '@/components/pastoral/PastoralWorkspaceBridge'

export const metadata: Metadata = { title: 'Espacio Pastoral' }

export default async function PaquetePastoralDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('rol, estado_cuenta').eq('id', user.id).single()
  const rol = (profile as { rol?: string } | null)?.rol
  const estadoCuenta = (profile as { estado_cuenta?: string | null } | null)?.estado_cuenta ?? 'activo'
  if (!['pastor', 'administrador'].includes(rol ?? '') || estadoCuenta !== 'activo') redirect('/inicio')

  const { data: paquete } = await (supabase as any)
    .from('pastoral_paquetes')
    .select('id, titulo, descripcion_publica, instrucciones, notas_privadas, bosquejo_id, coleccion_id, recurso_ids, estado, presentacion_diapositivas, presentacion_pdf_recurso_id, audiencia, publicado, destacado, public_slug')
    .eq('id', id)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!paquete) notFound()

  const [{ data: bosquejos }, { data: colecciones }, { data: bibliotecaBase }] = await Promise.all([
    (supabase as any).from('pastoral_bosquejos').select('id, titulo, tema, pasaje_base, proposito, introduccion, puntos, conclusion').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_colecciones').select('id, nombre, descripcion').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_biblioteca').select('id, titulo, descripcion, categoria, tipo, url, storage_path, mime_type, nombre_archivo').eq('profile_id', user.id).order('updated_at', { ascending: false }),
  ])

  const biblioteca = await Promise.all((bibliotecaBase ?? []).map(async (item: any) => {
    let acceso_url: string | null = item.tipo === 'enlace' ? item.url : null
    if (item.tipo === 'archivo' && item.storage_path) {
      const { data } = await supabase.storage.from('pastoral-library').createSignedUrl(item.storage_path, 60 * 60)
      acceso_url = data?.signedUrl ?? null
    }
    return { ...item, acceso_url }
  }))

  const bosquejo = (bosquejos ?? []).find((item: any) => item.id === paquete.bosquejo_id) ?? null
  const coleccionBase = (colecciones ?? []).find((item: any) => item.id === paquete.coleccion_id) ?? null
  let coleccion = null

  if (coleccionBase) {
    const { data: versiculos } = await (supabase as any)
      .from('pastoral_versiculos')
      .select('id, referencia, texto, traduccion, nota')
      .eq('coleccion_id', coleccionBase.id)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: true })
    coleccion = { ...coleccionBase, versiculos: versiculos ?? [] }
  }

  const idsSeleccionados = new Set<string>((paquete.recurso_ids ?? []) as string[])
  const recursosSeleccionados = biblioteca.filter((item: any) => idsSeleccionados.has(item.id))
  const pdfPresentacion = biblioteca.find((item: any) => item.id === paquete.presentacion_pdf_recurso_id) ?? null

  return (
    <main className="pastoral-bible-page mx-auto min-h-screen max-w-6xl px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-6 lg:px-8">
      <div className="mb-2 print:hidden">
        <Link href="/pastoral" className="inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-sm font-bold text-violet-700">
          <ArrowLeft className="h-4 w-4" /> Centro Pastoral
        </Link>
      </div>

      <div className="pastoral-bible-shell">
        <PastoralWorkspaceBridge paqueteId={paquete.id} />
        <PaqueteDetalleClient
          paquete={paquete as any}
          bosquejo={bosquejo as any}
          coleccion={coleccion as any}
          recursos={recursosSeleccionados as any}
          pdfPresentacion={pdfPresentacion as any}
          bosquejos={(bosquejos ?? []).map((item: any) => ({ id: item.id, titulo: item.titulo }))}
          colecciones={(colecciones ?? []).map((item: any) => ({ id: item.id, titulo: item.nombre }))}
          biblioteca={biblioteca as any}
        />
      </div>

      <style>{`
        .pastoral-bible-page {
          --vida-page: #f7f7f4;
          --vida-surface: #ffffff;
          --vida-soft: #f4f1fb;
          --vida-border: rgba(100, 116, 139, .16);
          --vida-text: #172033;
          --vida-muted: #64748b;
          background: var(--vida-page) !important;
          color: var(--vida-text);
        }

        html[data-biblia-tema="sepia"] .pastoral-bible-page {
          --vida-page: #efe5d0;
          --vida-surface: #f8f0df;
          --vida-soft: #eadcc4;
          --vida-border: rgba(107, 78, 48, .18);
          --vida-text: #34291f;
          --vida-muted: #766454;
        }

        html[data-biblia-tema="oscuro"] .pastoral-bible-page {
          --vida-page: #020617;
          --vida-surface: #0f172a;
          --vida-soft: #172033;
          --vida-border: rgba(148, 163, 184, .18);
          --vida-text: #f8fafc;
          --vida-muted: #a8b3c5;
        }

        .pastoral-bible-page .bg-white { background-color: var(--vida-surface) !important; }
        .pastoral-bible-page .bg-slate-50 { background-color: var(--vida-soft) !important; }
        .pastoral-bible-page .border-slate-200,
        .pastoral-bible-page .border-slate-100 { border-color: var(--vida-border) !important; }
        .pastoral-bible-page .text-slate-950,
        .pastoral-bible-page .text-slate-900,
        .pastoral-bible-page .text-slate-700 { color: var(--vida-text) !important; }
        .pastoral-bible-page .text-slate-600,
        .pastoral-bible-page .text-slate-500,
        .pastoral-bible-page .text-slate-400 { color: var(--vida-muted) !important; }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) {
          overflow: visible !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:first-child {
          overflow: hidden;
          border-radius: 1.75rem;
          box-shadow: 0 14px 36px rgba(91, 33, 182, .18);
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child {
          margin-top: .75rem;
          padding: .65rem .25rem .75rem;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scroll-snap-type: x proximity;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child::-webkit-scrollbar {
          display: none;
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child > div {
          gap: .65rem !important;
          padding-inline: .25rem;
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child button {
          min-width: 5.35rem !important;
          min-height: 4.75rem !important;
          flex-direction: column;
          justify-content: center;
          gap: .4rem !important;
          border: 1px solid var(--vida-border);
          border-radius: 1.4rem !important;
          padding: .65rem .6rem !important;
          background: var(--vida-surface);
          color: var(--vida-muted);
          text-align: center !important;
          scroll-snap-align: start;
          box-shadow: 0 4px 14px rgba(15, 23, 42, .05);
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child button.bg-violet-600 {
          border-color: transparent;
          background: linear-gradient(145deg, #6d28d9, #7c3aed) !important;
          color: #fff !important;
          box-shadow: 0 10px 24px rgba(109, 40, 217, .24);
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child button > span {
          min-width: 0;
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child button strong {
          white-space: nowrap;
          font-size: .72rem;
          line-height: 1rem;
        }

        .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child button strong + span {
          display: none;
        }

        .pastoral-bible-shell input,
        .pastoral-bible-shell textarea,
        .pastoral-bible-shell select {
          border-color: var(--vida-border) !important;
          background: var(--vida-surface) !important;
          color: var(--vida-text) !important;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .02);
        }

        @media (min-width: 768px) {
          .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child button {
            min-width: 8.5rem !important;
            flex-direction: row;
            justify-content: flex-start;
            text-align: left !important;
          }
          .pastoral-bible-shell > div.text-slate-900 > section:nth-of-type(2) > div:last-child button strong + span {
            display: block;
          }
        }
      `}</style>
    </main>
  )
}
