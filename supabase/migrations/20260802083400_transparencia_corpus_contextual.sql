-- FASE D · Bloque 4
-- Transparencia transversal del corpus contextual interno.
-- No modifica fuentes primarias, léxicos STEPBible ni fragmentos históricos externos.

update public.biblical_sources
set provider_version = 'profetas-mayores-v1-2026-08-02',
    content_hash = encode(extensions.digest('vida-contexto-editorial|profetas-mayores-v1-2026-08-02|ai-assisted-disclosure', 'sha256'), 'hex'),
    attribution = 'Vida Internacional — síntesis editorial asistida por IA y sujeta a revisión humana; no sustituye fuentes primarias, comentarios críticos ni asesoría pastoral.',
    license_notes = 'Contenido editorial interno. Las afirmaciones históricas y lingüísticas deben contrastarse con las fuentes específicas enlazadas cuando estén disponibles.',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'coverage', 'canon-through-major-prophets',
      'latest_batch', 'major-prophets',
      'generated_by_ai', true,
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
      'review_level', 'ai_assisted_editorial',
      'human_review_status', 'pending',
      'quality_tier', 'contextual_synthesis',
      'not_a_primary_source', true
    ),
    updated_at = now()
where unit.source_id = (
  select source.id
  from public.biblical_sources source
  where source.slug = 'vida-contexto-editorial'
);

-- Conserva la separación entre el corpus editorial y las fuentes verificables externas.
-- El servicio sigue recuperando únicamente filas aprobadas y habilitadas.