import { readFile, writeFile } from 'node:fs/promises'

const actionPath = 'app/actions/biblia.ts'
const clientPath = 'components/biblia/BibliaClient.tsx'

const actionContent = `'use server'

import { createClient } from '@/lib/supabase/server'

export type Favorito = {
  id: string
  traduccion: string
  libro_id: string
  libro_nombre: string
  capitulo: number
  verso: number
  texto: string
  created_at: string
}

/** Guarda o quita un versículo de favoritos. Devuelve el estado final. */
export async function toggleFavorito(datos: {
  traduccion: string; libro_id: string; libro_nombre: string
  capitulo: number; verso: number; texto: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existente } = await db
    .from('versiculos_favoritos')
    .select('id')
    .eq('profile_id', user.id)
    .eq('traduccion', datos.traduccion)
    .eq('libro_id', datos.libro_id)
    .eq('capitulo', datos.capitulo)
    .eq('verso', datos.verso)
    .maybeSingle()

  if (existente) {
    await db.from('versiculos_favoritos').delete().eq('id', existente.id)
    return { favorito: false }
  }

  const { error } = await db.from('versiculos_favoritos').insert({
    profile_id: user.id,
    ...datos,
    texto: datos.texto.slice(0, 1000),
  })
  if (error) return { error: 'No se pudo guardar.' }
  return { favorito: true }
}

/** Números de versículos favoritos del capítulo actual. */
export async function favoritosDelCapitulo(traduccion: string, libro_id: string, capitulo: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('versiculos_favoritos')
    .select('verso')
    .eq('profile_id', user.id)
    .eq('traduccion', traduccion)
    .eq('libro_id', libro_id)
    .eq('capitulo', capitulo)
  return (data ?? []).map((f: { verso: number }) => f.verso) as number[]
}

/** Lista completa de favoritos del usuario (más recientes primero). */
export async function listarFavoritos(): Promise<Favorito[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('versiculos_favoritos')
    .select('id, traduccion, libro_id, libro_nombre, capitulo, verso, texto, created_at')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)
  return (data ?? []) as Favorito[]
}
`

await writeFile(actionPath, actionContent, 'utf8')

let client = await readFile(clientPath, 'utf8')
const currentBlock = `    try {
      const resultado = await listarFavoritos()
      setListaFavs(resultado.favoritos)
      if (resultado.error) setErrorFavs(resultado.error)
    } catch {
      setListaFavs([])
      setErrorFavs('No se pudieron cargar los favoritos')
    } finally {
`
const compatibleBlock = `    try {
      const resultado = await listarFavoritos()
      const normalizado = resultado as unknown as Favorito[] | { favoritos?: Favorito[]; error?: string }
      const lista = Array.isArray(normalizado) ? normalizado : (normalizado.favoritos ?? [])
      setListaFavs(lista)
      if (!Array.isArray(normalizado) && normalizado.error) setErrorFavs(normalizado.error)
    } catch {
      setListaFavs([])
      setErrorFavs('No se pudieron cargar los favoritos')
    } finally {
`

if (client.includes(currentBlock)) {
  client = client.replace(currentBlock, compatibleBlock)
} else if (!client.includes('const normalizado = resultado as unknown as Favorito[]')) {
  throw new Error('No se encontró el bloque de favoritos esperado')
}

const reactDomImport = "import { createPortal } from 'react-dom'"
if (!client.includes(reactDomImport)) {
  client = client.replace("import Link from 'next/link'", "import Link from 'next/link'\nimport { createPortal } from 'react-dom'")
}

const brokenModalClass = 'flex h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top))-max(1.5rem,env(safe-area-inset-bottom)))] max-h-[52rem] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-3rem)]'
const visibleModalClass = 'flex min-h-[20rem] max-h-[86dvh] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]'
if (client.includes(brokenModalClass)) client = client.replace(brokenModalClass, visibleModalClass)
client = client.replace('flex min-h-[20rem] max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl', visibleModalClass)

const overlayClass = 'fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/55 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6'
const safeOverlayClass = 'fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/60 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-[3px] sm:items-center sm:p-6'
if (client.includes(overlayClass)) client = client.replace(overlayClass, safeOverlayClass)
client = client.replace('fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center sm:p-6', safeOverlayClass)
client = client.replace('fixed inset-0 z-[9999] flex items-end justify-center bg-black/55 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center sm:p-6', safeOverlayClass)

const portalOpen = "      {panelFavs && typeof document !== 'undefined' && createPortal(("
if (!client.includes(portalOpen)) {
  client = client.replace('      {panelFavs && (\n        <div', `${portalOpen}\n        <div`)
}

const portalClose = '      ), document.body)}\n    </main>'
if (!client.includes(portalClose)) {
  client = client.replace('      )}\n    </main>', portalClose)
}

client = client.replace(
  'relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5',
  'relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-white px-4 py-4 sm:px-5'
)
client = client.replace(
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500',
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition active:scale-95'
)
client = client.replace(
  'min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-6',
  'min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain bg-slate-50/70 px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-6'
)
client = client.replace(
  'overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/60',
  'overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.02]'
)
client = client.replace(
  'grid grid-cols-1 gap-2 border-t border-amber-100 bg-white/70 p-3 min-[380px]:grid-cols-2',
  'grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50/80 p-3 min-[380px]:grid-cols-2'
)

const panelStateAnchor = "  const [panelFavs, setPanelFavs] = useState(false)"
const modalBehaviorEffect = `

  useEffect(() => {
    if (!panelFavs) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelFavs(false)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [panelFavs])`

if (client.includes(panelStateAnchor) && !client.includes("document.body.style.overflow = 'hidden'")) {
  client = client.replace(panelStateAnchor, `${panelStateAnchor}${modalBehaviorEffect}`)
}

await writeFile(clientPath, client, 'utf8')
console.log('Compatibilidad, portal, pulido visual y comportamiento móvil de favoritos aplicados')
