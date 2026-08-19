'use strict'

const fs = require('node:fs')
const path = require('node:path')

const EXPECTED_VERSION = '3.6.7'
const UPSTREAM_FIX_REF = 'web-push-libs/web-push@658a8889aa06cb7292d16ae7f95773a9e97ded04'

function fail(message) {
  throw new Error(`[patch-web-push-dep0169] ${message}`)
}

function replaceExactly(source, from, to, label) {
  const matches = source.split(from).length - 1
  if (matches !== 1) fail(`Se esperaba una coincidencia para ${label}, se encontraron ${matches}.`)
  return source.replace(from, to)
}

const packageJsonPath = require.resolve('web-push/package.json', { paths: [process.cwd()] })
const packageRoot = path.dirname(packageJsonPath)
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

if (packageJson.version !== EXPECTED_VERSION) {
  fail(`Versión inesperada de web-push: ${packageJson.version}. Revisar el parche antes de continuar.`)
}

const targetPath = path.join(packageRoot, 'src', 'web-push-lib.js')
let source = fs.readFileSync(targetPath, 'utf8')

if (source.includes('url.parse(')) {
  source = replaceExactly(
    source,
    "const url = require('url');\n",
    '',
    'require(url)',
  )
  source = replaceExactly(
    source,
    'const parsedUrl = url.parse(subscription.endpoint);',
    'const parsedUrl = new URL(subscription.endpoint);',
    'audience VAPID',
  )
  source = replaceExactly(
    source,
    'const urlParts = url.parse(requestDetails.endpoint);',
    'const urlParts = new URL(requestDetails.endpoint);',
    'endpoint HTTPS',
  )
  source = replaceExactly(
    source,
    'httpsOptions.path = urlParts.path;',
    'httpsOptions.path = urlParts.pathname + urlParts.search;',
    'pathname + search',
  )
  fs.writeFileSync(targetPath, source)
}

const finalSource = fs.readFileSync(targetPath, 'utf8')
if (finalSource.includes('url.parse(')) fail('El código instalado todavía contiene url.parse().')
if (finalSource.includes("const url = require('url');")) fail('El require legado de url todavía está presente.')
if (!finalSource.includes('const parsedUrl = new URL(subscription.endpoint);')) fail('Falta el reemplazo WHATWG para el audience VAPID.')
if (!finalSource.includes('const urlParts = new URL(requestDetails.endpoint);')) fail('Falta el reemplazo WHATWG para el endpoint HTTPS.')
if (!finalSource.includes('httpsOptions.path = urlParts.pathname + urlParts.search;')) fail('No se conserva pathname + search del endpoint.')

console.log(`[patch-web-push-dep0169] web-push ${EXPECTED_VERSION} corregido según ${UPSTREAM_FIX_REF}`)
