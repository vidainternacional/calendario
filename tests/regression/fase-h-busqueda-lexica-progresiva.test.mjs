import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260820060448_fase_h_busqueda_lexica_progresiva.sql', 'utf8')

test('FASE H bloque 3: índice derivado queda separado del léxico autoritativo', () => {
  assert.match(migration, /create table public\.biblical_hebrew_search_resolutions/)
  assert.match(migration, /references public\.biblical_lexical_entries\(id\)/)
  assert.match(migration, /No sustituye ni modifica el léxico autoritativo/)
  assert.doesNotMatch(migration, /alter table public\.biblical_lexical_entries/)
  assert.doesNotMatch(migration, /update public\.biblical_lexical_entries/)
})

test('FASE H bloque 3: RLS expone solo lectura a cuentas autenticadas', () => {
  assert.match(migration, /enable row level security/)
  assert.match(migration, /revoke all on table public\.biblical_hebrew_search_resolutions from anon, authenticated/)
  assert.match(migration, /grant select on table public\.biblical_hebrew_search_resolutions to authenticated/)
  assert.match(migration, /grant all on table public\.biblical_hebrew_search_resolutions to service_role/)
  assert.match(migration, /for select\s+to authenticated/)
  assert.match(migration, /public\.cuenta_activa\(\)/)
  assert.doesNotMatch(migration, /for (?:insert|update|delete)\s+to authenticated/i)
})

test('FASE H bloque 3: índice no guarda identidad ni historial personal', () => {
  assert.doesNotMatch(migration, /profile_id|user_id|searched_by|created_by/)
  assert.match(migration, /no debe contener identidad del usuario ni historial personal de búsqueda/)
  assert.doesNotMatch(catalog, /profile_id|user_id|auth\.uid/)
})

test('FASE H bloque 3: escritura derivada ocurre exclusivamente con cliente service-role server-only', () => {
  assert.match(catalog, /import \{ createServiceClient \} from '@\/lib\/supabase\/service'/)
  assert.match(catalog, /function persistSearchResolutions/)
  assert.match(catalog, /createServiceClient\(\)/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
})

test('FASE H bloque 3: forma flexionada se verifica reconstruyendo la palabra real', () => {
  assert.match(catalog, /function inflectedHebrewSearch/)
  assert.match(catalog, /word_group_key/)
  assert.match(catalog, /morpheme_index/)
  assert.match(catalog, /reconstructed !== target/)
  assert.match(catalog, /relationKind: 'inflected_form'/)
  assert.match(catalog, /exact_reconstructed_surface: true/)
})

test('FASE H bloque 3: transliteración se resuelve desde ocurrencias aprobadas', () => {
  assert.match(catalog, /function transliterationSearch/)
  assert.match(catalog, /occurrence_transliteration/)
  assert.match(catalog, /normalizeLatinCompact/)
  assert.match(catalog, /relationKind: 'transliteration'/)
  assert.match(catalog, /exact_normalized_transliteration: true/)
})

test('FASE H bloque 3: español contextual conserva cautela pero devuelve un candidato principal', () => {
  assert.match(catalog, /function contextualSpanishSearch/)
  assert.match(catalog, /Resultado contextual principal/)
  assert.match(catalog, /No se presenta como equivalencia uno-a-uno/)
  assert.match(catalog, /const primary = ranked\[0\]/)
  assert.match(catalog, /rows: \[primary\]/)
  assert.match(catalog, /candidate_policy: 'single-primary-content-word'/)
  assert.match(catalog, /resolver: 'rv1909-context-v2'/)
})

test('FASE H bloque 3: ruido contextual no puede dominar la respuesta de aprendizaje', () => {
  assert.match(catalog, /function isContextualLearningCandidate/)
  assert.match(catalog, /partOfSpeech === 'prefix' \|\| partOfSpeech === 'suffix'/)
  assert.match(catalog, /\^H90\\d/)
  assert.match(catalog, /verseEvidence/)
  assert.match(catalog, /primaryEvidence < 2/)
})

test('FASE H bloque 3: búsquedas españolas toleran tildes sin convertirlas en equivalencias inventadas', () => {
  assert.match(catalog, /SPANISH_DIACRITIC_REPLACEMENTS/)
  assert.match(catalog, /function spanishSearchVariants/)
  assert.match(catalog, /original_text\.ilike/)
  assert.match(catalog, /display_gloss_es\.ilike/)
})

test('FASE H bloque 3: caché ignora relaciones contextuales antiguas y reutiliza solo resolver preciso', () => {
  assert.match(catalog, /select\('lexical_entry_id, relation_kind, confidence, evidence_count, provenance'\)/)
  assert.match(catalog, /resolution\.relation_kind !== 'contextual'/)
  assert.match(catalog, /resolution\.provenance\?\.resolver === 'rv1909-context-v2'/)
})

test('FASE H bloque 3: una resolución guardada se consulta antes del fallback costoso', () => {
  assert.match(catalog, /function cachedResolutionSearch/)
  const flow = catalog.slice(catalog.indexOf('export async function listarCatalogoHebreoParaAprendizaje'))
  assert.ok(flow.indexOf('cachedResolutionSearch') < flow.lastIndexOf('contextualSpanishSearch'))
  assert.ok(flow.indexOf('cachedResolutionSearch') < flow.lastIndexOf('transliterationSearch'))
})
