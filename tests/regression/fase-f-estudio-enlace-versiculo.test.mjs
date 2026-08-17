import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const estudio = fs.readFileSync('components/estudios/EstudioProfundoClient.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/biblia/page.tsx', 'utf8')
const deepLink = fs.readFileSync('components/biblia/BibliaDeepLinkNavigation.tsx', 'utf8')

test('FASE F: las referencias de concordancia abren libro capítulo y versículo exactos en Biblia', () => {
  assert.match(estudio, /\/biblia\?book=\$\{encodeURIComponent\(match\.bookCode\)\}&chapter=\$\{match\.chapter\}&verse=\$\{match\.verse\}/)
  assert.match(page, /BibliaDeepLinkNavigation/)
  assert.match(page, /<BibliaDeepLinkNavigation \/>/)
  assert.match(deepLink, /new URLSearchParams\(window\.location\.search\)/)
  assert.match(deepLink, /params\.get\('book'\)/)
  assert.match(deepLink, /params\.get\('chapter'\)/)
  assert.match(deepLink, /params\.get\('verse'\)/)
  assert.match(deepLink, /select\[aria-label="Libro de la Biblia"\]/)
  assert.match(deepLink, /option\.value\.toLowerCase\(\) === book\.toLowerCase\(\)/)
  assert.match(deepLink, /select\[aria-label="Capítulo"\]/)
  assert.match(deepLink, /select\[aria-label="Versículo"\]/)
  assert.match(deepLink, /previousVerseNode\.isConnected/)
  assert.match(deepLink, /document\.getElementById\(`versiculo-\$\{verse\}`\)/)
  assert.match(deepLink, /dispararCambio\(verseSelect, String\(verse\)\)/)
})
