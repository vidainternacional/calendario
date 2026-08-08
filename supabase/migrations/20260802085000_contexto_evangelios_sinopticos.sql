-- FASE D · Bloque 4 · Evangelios sinópticos
-- Migración aplicada en Supabase: contexto_evangelios_sinopticos.
-- Este archivo versiona el lote editorial aprobado para Mateo, Marcos y Lucas.
-- La carga completa conserva perfiles de libro y secciones narrativas con fuente
-- vida-contexto-editorial, versión evangelios-hechos-v1-2026-08-02,
-- hashes SHA-256, review_status approved y metadata generated_by_ai=false.

update public.biblical_sources
set provider_version='evangelios-hechos-v1-2026-08-02',
    content_hash=encode(extensions.digest('vida-contexto-editorial|evangelios-hechos-v1-2026-08-02','sha256'),'hex'),
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('latest_batch','gospels-acts','generated_by_ai',false),
    updated_at=now()
where slug='vida-contexto-editorial';

update public.biblical_books
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('coverage_status','context_ready'),
    updated_at=now()
where code in ('MAT','MRK','LUK');

-- El contenido fue insertado idempotentemente mediante on conflict (slug) do update.
-- Slugs versionados en este lote:
-- mateo-perfil
-- mateo-1-4-origen-mision
-- mateo-5-7-sermon
-- mateo-8-13-obras-parabolas
-- mateo-14-20-identidad-comunidad
-- mateo-21-28-pasion-mision
-- marcos-perfil
-- marcos-1-8-galilea
-- marcos-8-10-camino
-- marcos-11-16-jerusalen
-- lucas-perfil
-- lucas-1-4-promesa-mision
-- lucas-5-9-galilea
-- lucas-10-19-viaje
-- lucas-19-24-jerusalen

-- La migración reproducible completa queda documentada por su registro aplicado
-- y por docs/FASE_D_CORPUS_CONTEXTO_EVANGELIOS_HECHOS.md.
-- No se incluyen textos bíblicos protegidos ni contenido generado en tiempo de consulta.