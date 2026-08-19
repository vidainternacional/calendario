import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('un push recibido refresca de inmediato Avisos, Para ti y badges compartidos', () => {
  const sync = source('components/pwa/PushSubscriptionSync.tsx')
  const sw = source('public/sw.js')

  assert.match(sync, /VIDA_PUSH_RECEIVED/)
  assert.match(sync, /requestPendingIndicatorsRefresh\(\)/)
  assert.match(sync, /requestUnreadPublicationsRefresh\(\)/)
  assert.match(sync, /PUSH_REFRESH_COALESCE_MS/)
  assert.match(sync, /navigator\.serviceWorker\.addEventListener\('message'/)
  assert.doesNotMatch(sync, /event\.data\.url\?\.startsWith\('\/avisos'\)/)

  assert.match(sw, /Promise\.all\(\[/)
  assert.match(sw, /client\.postMessage\(\{ type: 'VIDA_PUSH_RECEIVED', tag, url: options\.data\.url \}\)/)
})

test('el postinstall elimina DEP0169 de web-push 3.6.7 sin ocultar deprecaciones', () => {
  const packageJson = JSON.parse(source('package.json'))
  const patchScript = source('scripts/patch-web-push-dep0169.cjs')
  const installedSource = source('node_modules/web-push/src/web-push-lib.js')

  assert.equal(packageJson.scripts.postinstall, 'node scripts/patch-web-push-dep0169.cjs')
  assert.match(patchScript, /EXPECTED_VERSION = '3\.6\.7'/)
  assert.match(patchScript, /new URL\(subscription\.endpoint\)/)
  assert.match(patchScript, /new URL\(requestDetails\.endpoint\)/)
  assert.match(patchScript, /urlParts\.pathname \+ urlParts\.search/)
  assert.doesNotMatch(installedSource, /url\.parse\(/)
  assert.doesNotMatch(installedSource, /const url = require\('url'\)/)
  assert.match(installedSource, /const parsedUrl = new URL\(subscription\.endpoint\);/)
  assert.match(installedSource, /const urlParts = new URL\(requestDetails\.endpoint\);/)
  assert.match(installedSource, /httpsOptions\.path = urlParts\.pathname \+ urlParts\.search;/)

  const smoke = `
    const webpush = require('web-push')
    const keys = webpush.generateVAPIDKeys()
    webpush.setVapidDetails('mailto:ci@example.invalid', keys.publicKey, keys.privateKey)
    const endpoint = 'https://push.example.invalid/send/path?token=vida'
    const details = webpush.generateRequestDetails({ endpoint }, null, { TTL: 60 })
    if (details.endpoint !== endpoint) process.exit(2)
    if (!details.headers || !details.headers.Authorization) process.exit(3)
  `

  execFileSync(process.execPath, ['--throw-deprecation', '-e', smoke], {
    cwd: new URL('../..', import.meta.url),
    stdio: 'pipe',
  })
})
