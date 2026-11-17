import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarModulo } from './seguridad-real-loader.mjs'

const navigation = cargarModulo('lib/estudios/study-navigation.ts')

test('retorno al estudio conserva consulta, sección, concordancias y origen sin deformar la búsqueda', () => {
  const query = '¿Qué significa amor? & Juan 3:16'
  const href = navigation.studyResumeHref(query, 'contexto_historico', 'concordance', 'biblia')
  const url = new URL(href, 'https://vida.invalid')
  assert.equal(url.searchParams.get('q'), query)
  assert.equal(url.searchParams.get('section'), 'contexto_historico')
  assert.equal(url.searchParams.get('tab'), 'concordancias')
  assert.equal(url.searchParams.get('from'), 'biblia')
  assert.equal(url.searchParams.get('auto'), '1')
  assert.equal(navigation.studyReturnHref(href), href)
})

test('un retorno malicioso no puede salir de Estudio Profundo', () => {
  for (const value of ['https://evil.example/estudios/profundo', '//evil.example/estudios/profundo', 'javascript:alert(1)', '/login', '/estudios/profundo/../login', '/estudios/profundo\\evil', '/estudios/profundo\n', '/estudios/profundo\u0000', '/estudios/profundo?q=' + 'x'.repeat(2500)]) {
    assert.equal(navigation.studyReturnHref(value), null, value)
  }
})

test('no propaga orígenes arbitrarios a la página de estudio', () => {
  for (const origin of ['https://evil.example', '/admin', '']) {
    const url = new URL(navigation.studyResumeHref('Salmos 27', null, 'study', origin), 'https://vida.invalid')
    assert.equal(url.searchParams.has('from'), false)
    assert.equal(url.searchParams.has('section'), false)
    assert.equal(url.searchParams.has('tab'), false)
  }
})
