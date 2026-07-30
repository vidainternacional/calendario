import 'server-only'

import { createHash } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'

export type TipoFuenteBiblica =
  | 'provider_catalog'
  | 'translation'
  | 'commentary'
  | 'cross_reference'
  | 'profile'
  | 'historical'

export type FuenteBiblicaAprobada = {
  slug: string
  name: string
  sourceType: TipoFuenteBiblica
  language: string | null
  website: string | null
  licenseUrl: string | null
  licenseNotes: string | null
  licenseStatus: 'verified' | 'varies_by_item' | 'pending' | 'restricted'
  provider: string
  providerRef: string
  providerVersion: string | null
  contentHash: string | null
  attribution: string
  metadata: Record<string, unknown>
  approvedAt: string | null
}

export type CatalogoFuentesBiblicas = {
  version: string
  sources: FuenteBiblicaAprobada[]
}

type FuenteRow = {
  slug: string
  name: string
  source_type: TipoFuenteBiblica
  language: string | null
  website: string | null
  license_url: string | null
  license_notes: string | null
  license_status: FuenteBiblicaAprobada['licenseStatus']
  provider: string
  provider_ref: string
  provider_version: string | null
  content_hash: string | null
  attribution: string
  metadata: Record<string, unknown> | null
  approved_at: string | null
}

function mapSource(row: FuenteRow): FuenteBiblicaAprobada {
  return {
    slug: row.slug,
    name: row.name,
    sourceType: row.source_type,
    language: row.language,
    website: row.website,
    licenseUrl: row.license_url,
    licenseNotes: row.license_notes,
    licenseStatus: row.license_status,
    provider: row.provider,
    providerRef: row.provider_ref,
    providerVersion: row.provider_version,
    contentHash: row.content_hash,
    attribution: row.attribution,
    metadata: row.metadata ?? {},
    approvedAt: row.approved_at,
  }
}

function catalogVersion(sources: FuenteBiblicaAprobada[]) {
  const fingerprint = sources.map((source) => ({
    slug: source.slug,
    provider: source.provider,
    providerRef: source.providerRef,
    providerVersion: source.providerVersion,
    contentHash: source.contentHash,
    licenseUrl: source.licenseUrl,
    attribution: source.attribution,
  }))

  return createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex')
    .slice(0, 16)
}

async function authenticatedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

export async function listarFuentesBiblicasAprobadas(): Promise<CatalogoFuentesBiblicas> {
  const supabase = await authenticatedClient()
  if (!supabase) return { version: 'sin-sesion', sources: [] }

  const { data, error } = await (supabase as any)
    .from('biblical_sources')
    .select(`
      slug,
      name,
      source_type,
      language,
      website,
      license_url,
      license_notes,
      license_status,
      provider,
      provider_ref,
      provider_version,
      content_hash,
      attribution,
      metadata,
      approved_at
    `)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .order('source_type', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('[biblical-sources] No se pudo cargar el catálogo:', error)
    return { version: 'no-disponible', sources: [] }
  }

  const sources = ((data ?? []) as FuenteRow[]).map(mapSource)
  return {
    version: catalogVersion(sources),
    sources,
  }
}

export async function obtenerFuenteBiblica(slug: string): Promise<FuenteBiblicaAprobada | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null

  const supabase = await authenticatedClient()
  if (!supabase) return null

  const { data, error } = await (supabase as any)
    .from('biblical_sources')
    .select(`
      slug,
      name,
      source_type,
      language,
      website,
      license_url,
      license_notes,
      license_status,
      provider,
      provider_ref,
      provider_version,
      content_hash,
      attribution,
      metadata,
      approved_at
    `)
    .eq('slug', slug)
    .eq('enabled', true)
    .eq('review_status', 'approved')
    .maybeSingle()

  if (error) {
    console.error('[biblical-sources] No se pudo cargar la fuente:', error)
    return null
  }

  return data ? mapSource(data as FuenteRow) : null
}
