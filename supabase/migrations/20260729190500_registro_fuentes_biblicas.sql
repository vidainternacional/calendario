create table if not exists public.biblical_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_type text not null,
  language text,
  website text,
  license_url text,
  license_notes text,
  license_status text not null default 'pending',
  provider text not null,
  provider_ref text not null,
  provider_version text,
  content_hash text,
  attribution text not null,
  review_status text not null default 'pending',
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_sources_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint biblical_sources_type_check check (
    source_type in (
      'provider_catalog',
      'translation',
      'commentary',
      'cross_reference',
      'profile',
      'historical'
    )
  ),
  constraint biblical_sources_license_status_check check (
    license_status in ('verified', 'varies_by_item', 'pending', 'restricted')
  ),
  constraint biblical_sources_review_status_check check (
    review_status in ('approved', 'pending', 'rejected')
  ),
  constraint biblical_sources_provider_ref_key unique (provider, provider_ref)
);

create index if not exists idx_biblical_sources_enabled_type
  on public.biblical_sources (enabled, review_status, source_type, name);

alter table public.biblical_sources enable row level security;

revoke all on table public.biblical_sources from anon, authenticated;
grant select on table public.biblical_sources to authenticated;

drop policy if exists "Usuarios activos leen fuentes bíblicas aprobadas" on public.biblical_sources;

create policy "Usuarios activos leen fuentes bíblicas aprobadas"
on public.biblical_sources
for select
to authenticated
using (
  enabled
  and review_status = 'approved'
  and (select public.cuenta_activa())
);

insert into public.biblical_sources (
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
  review_status,
  enabled,
  metadata,
  approved_at
)
values
  (
    'helloao-catalog',
    'Free Use Bible API — Catálogo',
    'provider_catalog',
    'mul',
    'https://bible.helloao.org/',
    null,
    'Cada traducción, comentario y dataset conserva su propia licencia y atribución. Esta entrada registra únicamente el proveedor y su catálogo de metadatos.',
    'varies_by_item',
    'HelloAO',
    'catalog',
    '2026-07-29',
    null,
    'Metadatos provistos por Free Use Bible API (HelloAO).',
    'approved',
    true,
    jsonb_build_object(
      'api_base', 'https://bible.helloao.org/api',
      'catalog_endpoints', jsonb_build_array(
        '/available_translations.json',
        '/available_commentaries.json',
        '/available_datasets.json'
      ),
      'content_imported', false
    ),
    now()
  ),
  (
    'open-cross-ref',
    'Bible Cross References',
    'cross_reference',
    'eng',
    'https://www.openbible.info/labs/cross-references/',
    'https://creativecommons.org/licenses/by/4.0/',
    'HelloAO adaptó el formato de los datos para su API. La atribución y los términos CC BY 4.0 deben conservarse.',
    'verified',
    'HelloAO',
    'open-cross-ref',
    '2026-07-29',
    null,
    'Bible Cross References, OpenBible.info; formato adaptado por Free Use Bible API. Licencia CC BY 4.0.',
    'approved',
    true,
    jsonb_build_object(
      'api_books', '/d/open-cross-ref/books.json',
      'number_of_books', 66,
      'total_chapters', 1189,
      'total_verses', 29364,
      'total_references', 344799,
      'content_imported', false
    ),
    now()
  ),
  (
    'adam-clarke-commentary',
    'Adam Clarke Bible Commentary',
    'commentary',
    'eng',
    'https://en.wikipedia.org/wiki/Adam_Clarke',
    'https://creativecommons.org/publicdomain/mark/1.0/',
    'La edición publicada por HelloAO está marcada como dominio público. Requiere revisión doctrinal antes de habilitar su contenido dentro de Vida.',
    'verified',
    'HelloAO',
    'adam-clarke',
    '2026-07-29',
    '92e28c9363c876d215e296f2fe04abb3ab7e34a2aacebdf06bd62ae79c6e3dba',
    'Adam Clarke Bible Commentary; edición distribuida por Free Use Bible API. Public Domain Mark 1.0.',
    'pending',
    false,
    jsonb_build_object(
      'api_books', '/c/adam-clarke/books.json',
      'number_of_books', 57,
      'total_chapters', 854,
      'total_verses', 13318,
      'content_imported', false,
      'pending_review', 'doctrinal'
    ),
    null
  ),
  (
    'tyndale-open-study-notes',
    'Tyndale Open Study Notes',
    'commentary',
    'eng',
    'https://tyndaleopenresources.com/',
    'https://creativecommons.org/licenses/by-sa/4.0/',
    'HelloAO cambió el formato a JSON sin modificar el contenido. La licencia ShareAlike y el contenido requieren revisión antes de habilitarse.',
    'verified',
    'HelloAO',
    'tyndale',
    '2026-07-29',
    '62fa003ca326f8ab22a04accb2a49d2b5865ce2cecd74284228e1be08edd5e10',
    'Tyndale Open Study Notes; formato JSON de Free Use Bible API. Licencia CC BY-SA 4.0.',
    'pending',
    false,
    jsonb_build_object(
      'api_books', '/c/tyndale/books.json',
      'api_profiles', '/c/tyndale/profiles.json',
      'number_of_books', 69,
      'total_chapters', 1243,
      'total_verses', 15757,
      'total_profiles', 125,
      'content_imported', false,
      'pending_review', jsonb_build_array('doctrinal', 'share_alike')
    ),
    null
  )
on conflict (slug) do update set
  name = excluded.name,
  source_type = excluded.source_type,
  language = excluded.language,
  website = excluded.website,
  license_url = excluded.license_url,
  license_notes = excluded.license_notes,
  license_status = excluded.license_status,
  provider = excluded.provider,
  provider_ref = excluded.provider_ref,
  provider_version = excluded.provider_version,
  content_hash = excluded.content_hash,
  attribution = excluded.attribution,
  review_status = excluded.review_status,
  enabled = excluded.enabled,
  metadata = excluded.metadata,
  approved_at = excluded.approved_at,
  updated_at = now();
