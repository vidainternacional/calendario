-- FASE D · Bloque 4
-- Normaliza duplicados exactos y declara la asistencia editorial de todo el corpus VIDA.

with ranked as (
  select
    id,
    row_number() over (
      partition by book_code, scope_kind, chapter_start, chapter_end,
        coalesce(verse_start, 0), coalesce(verse_end, 0)
      order by
        case when metadata->>'generated_by_ai' = 'false' then 0 else 1 end,
        char_length(summary) desc,
        slug
    ) as position
  from public.biblical_context_units
  where enabled
    and review_status = 'approved'
    and source_id = (
      select id from public.biblical_sources where slug = 'vida-contexto-editorial'
    )
)
update public.biblical_context_units unit
set enabled = false,
    review_status = 'rejected',
    metadata = coalesce(unit.metadata, '{}'::jsonb) || jsonb_build_object(
      'disabled_reason', 'duplicate_exact_scope',
      'disabled_at', now()
    ),
    updated_at = now()
from ranked
where ranked.id = unit.id
  and ranked.position > 1;

update public.biblical_sources
set attribution = 'Vida Internacional — síntesis editorial asistida por IA y sujeta a revisión humana; no sustituye fuentes primarias, comentarios críticos, léxicos ni asesoría pastoral.',
    license_notes = 'Contenido editorial interno. Los datos históricos, textuales y lingüísticos deben contrastarse con las fuentes específicas enlazadas cuando estén disponibles.',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'generated_by_ai', true,
      'editorial_method', 'ai-assisted-contextual-synthesis',
      'review_level', 'ai_assisted_editorial',
      'human_review_status', 'pending',
      'quality_tier', 'contextual_synthesis',
      'not_a_primary_source', true
    ),
    updated_at = now()
where slug = 'vida-contexto-editorial';

update public.biblical_context_units unit
set metadata = coalesce(unit.metadata, '{}'::jsonb) || jsonb_build_object(
      'generated_by_ai', true,
      'editorial_method', 'ai-assisted-contextual-synthesis',
      'review_level', 'ai_assisted_editorial',
      'human_review_status', 'pending',
      'quality_tier', 'contextual_synthesis',
      'not_a_primary_source', true
    ),
    updated_at = now()
where unit.source_id = (
  select id from public.biblical_sources where slug = 'vida-contexto-editorial'
);

create unique index if not exists biblical_context_units_active_exact_scope_unique
  on public.biblical_context_units (
    book_code, scope_kind, chapter_start, chapter_end,
    coalesce(verse_start, 0), coalesce(verse_end, 0)
  )
  where enabled and review_status = 'approved';