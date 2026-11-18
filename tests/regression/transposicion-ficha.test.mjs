import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'
const { transportarTono, transportarCifrado } = cargarModulo('lib/musica/transponer.ts')

test('transporta acordes mayores, menores, inversiones y extensiones conservando estructura', () => {
  const original = 'Intro: C - G/B - Am7 - F\nPuente: B7sus4 - Em7(add4) - D13(b5)'
  assert.equal(transportarCifrado(original, 2), 'Intro: D - A/C# - Bm7 - G\nPuente: C#7sus4 - F#m7(add4) - E13(b5)')
  assert.equal(transportarTono('C#m', -1), 'Cm')
  assert.equal(transportarTono('Bb', 2), 'C')
})

test('mantiene espacios de alineación, letras y anotaciones sin transportar palabras', () => {
  assert.equal(transportarCifrado('C      G/B\nA ti va esta prueba\n[C]Texto [Am]propio\nIntro x2', 2), 'D      A/C#\nA ti va esta prueba\n[D]Texto [Bm]propio\nIntro x2')
})

test('suma y resta semitonos sin cambiar modos ni perder modificadores', () => {
  assert.equal(transportarCifrado(transportarCifrado('C#m7 - F#sus4 - G#/C', 3), -3), 'C#m7 - F#sus4 - G#/C')
})


test('transporta también bajos y notas enarmónicas poco frecuentes', () => {
  assert.equal(transportarCifrado('B# - Cb - E# - Fb', 1), 'C# - C - F# - F')
})


function accionOficial(rol) {
  const cambios = []
  const admin = { from(tabla) { return { select() { return this }, eq() { return this }, update(payload) { cambios.push(payload); return this }, async maybeSingle() { return { data: tabla === 'profiles' ? { rol, activo: true, estado_cuenta: 'activo' } : tabla === 'ministerio_miembros' ? { es_lider: false } : { id: 'cancion' } } }, then(resolve) { return Promise.resolve({ error: null }).then(resolve) } } } }
  const action = cargarModulo('app/actions/setlist-alabanza.ts', { 'next/cache': { revalidatePath() {} }, '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'editor' } } }) } }), createAdminClient: () => admin } })
  return { action, cambios }
}

test('el guardado oficial de una transposición actualiza solo tono y acordes, con sesión autorizada', async () => {
  const { action, cambios } = accionOficial('administrador')
  const r = await action.guardarVersionOficialCancionSetlist('ministerio', 'cancion', { tonalidadBase: 'D', acordes: 'D - A - Bm - G' })
  assert.equal(r.success, true)
  assert.equal(cambios[0].tonalidad_base, 'D')
  assert.equal(cambios[0].acordes, 'D - A - Bm - G')
  assert.deepEqual(Object.keys(cambios[0]).sort(), ['acordes', 'tonalidad_base', 'updated_at'])
})

test('un músico sin autorización mantiene lectura personal sin poder guardar la versión oficial', async () => {
  const { action, cambios } = accionOficial('miembro')
  assert.equal((await action.guardarVersionOficialCancionSetlist('ministerio', 'cancion', { tonalidadBase: 'D', acordes: 'D' })).success, false)
  assert.equal(cambios.length, 0)
})
