import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync('supabase/migrations/20260820072000_fase_h_glosas_espanolas_derivadas_alta_confianza.sql', 'utf8')
const helper = fs.readFileSync('lib/hebreo/spanish-glosses.ts', 'utf8')
const route = fs.readFileSync('app/api/estudios/hebreo/palabras/route.ts', 'utf8')

test('FASE H bloque 3: glosas españolas derivadas quedan separadas del léxico autoritativo', () => {
  assert.match(migration, /create table public\.biblical_hebrew_spanish_glosses/)
  assert.match(migration, /references public\.biblical_lexical_entries\(id\)/)
  assert.match(migration, /No sustituye ni modifica el léxico autoritativo/)
  assert.doesNotMatch(migration, /alter table public\.biblical_lexical_entries/)
  assert.doesNotMatch(migration, /update public\.biblical_lexical_entries/)
})

test('FASE H bloque 3: capa derivada española es solo lectura para cuentas activas', () => {
  assert.match(migration, /enable row level security/)
  assert.match(migration, /revoke all on table public\.biblical_hebrew_spanish_glosses from anon, authenticated/)
  assert.match(migration, /grant select on table public\.biblical_hebrew_spanish_glosses to authenticated/)
  assert.match(migration, /grant all on table public\.biblical_hebrew_spanish_glosses to service_role/)
  assert.match(migration, /public\.cuenta_activa\(\)/)
  assert.doesNotMatch(migration, /for (?:insert|update|delete)\s+to authenticated/i)
})

test('FASE H bloque 3: lote heredado de griego queda como candidato hasta verificación léxica española', () => {
  assert.match(migration, /language='greek'/)
  assert.match(migration, /review_status='approved'/)
  assert.match(migration, /having count\(\*\)=1 and count\(distinct display_gloss_es\)=1/)
  assert.match(migration, /g\.pos=coalesce\(h\.part_of_speech,''\)/)
  assert.match(migration, /not in \('prefix','suffix','connector','pronominal_suffix'\)/)
  assert.match(migration, /'candidate'/)
  assert.match(migration, /\n  70,/)
  assert.match(migration, /candidate_until_lexical_spanish_verified/)
})

test('FASE H bloque 3: endpoint solo expone glosas verificadas o aprobadas manualmente', () => {
  assert.match(helper, /import 'server-only'/)
  assert.match(helper, /from\('biblical_hebrew_spanish_glosses'\)/)
  assert.match(helper, /\.in\('status', \['verified_derived', 'manual_approved'\]\)/)
  assert.match(helper, /if \(item\.spanish\) return item/)
  assert.match(helper, /spanish: derived\.display_gloss_es/)
  assert.match(route, /enriquecerCatalogoConGlosasEspanolas/)
  assert.match(route, /baseResult\.status === 'ok'/)
})

test('FASE H bloque 3: integración derivada no escribe datos desde el endpoint', () => {
  assert.doesNotMatch(helper, /\.insert\(|\.upsert\(|\.update\(|\.delete\(/)
  assert.doesNotMatch(route, /\.insert\(|\.upsert\(|\.update\(|\.delete\(/)
})
