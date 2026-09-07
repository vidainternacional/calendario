import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const errors = []
const fail = (message) => errors.push(message)
const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'))

for (const required of ['__VIDA_INTERNACIONAL.md', '.vida/guardrails.json', '.vida/change-scope.json']) {
  if (!fs.existsSync(required)) {
    console.error(`[VIDA GUARDRAIL] Falta ${required}`)
    process.exit(1)
  }
}

const rules = readJson('.vida/guardrails.json')
const scope = readJson('.vida/change-scope.json')

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function wildcardToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§DOUBLE§§')
    .replace(/\*/g, '[^/]*')
    .replace(/§§DOUBLE§§/g, '.*')
  return new RegExp(`^${escaped}$`)
}

function matches(path, patterns = []) {
  return patterns.some((pattern) => wildcardToRegExp(pattern).test(path))
}

let parent
try {
  parent = git('rev-parse', 'HEAD^')
} catch {
  console.log('[VIDA GUARDRAIL] Sin commit padre; no hay diff que validar.')
  process.exit(0)
}

const changed = git('diff', '--name-only', parent, 'HEAD')
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

if (!scope.task || !scope.userRequest || !Array.isArray(scope.allowedPaths) || scope.allowedPaths.length === 0) {
  fail('.vida/change-scope.json debe declarar task, userRequest y allowedPaths antes de modificar código.')
}

for (const path of changed) {
  if (!matches(path, scope.allowedPaths)) {
    fail(`Cambio fuera de alcance: ${path}. Si el usuario no lo pidió literalmente, no se toca.`)
  }
}

if (changed.includes(rules.masterFile) && scope.allowMasterUpdate !== true) {
  fail(`${rules.masterFile} está bloqueado sin aprobación explícita del usuario.`)
}

if (changed.some((path) => rules.sensitivePrefixes.some((prefix) => path.startsWith(prefix))) && scope.allowSupabase !== true) {
  fail('Cambio en Supabase/datos sensibles sin desbloqueo explícito en .vida/change-scope.json.')
}

const codePaths = changed.filter((path) => /\.(tsx?|jsx?|css)$/.test(path))
if (codePaths.length) {
  const diff = git('diff', '--unified=3', parent, 'HEAD', '--', ...codePaths)
  const added = diff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .join('\n')

  if (/<details\b[^>]*\bopen(?:\s|=|>)/is.test(added) || /defaultOpen\s*=\s*\{?true\}?/i.test(added)) {
    fail('Nuevo desplegable abierto por defecto. La regla VIDA exige iniciar contraído.')
  }

  if (added.includes('!important') && scope.allowImportantCss !== true) {
    fail('Nuevo !important bloqueado: puede alterar visuales fuera del alcance.')
  }

  if (changed.some((path) => /(^|\/)layout\.tsx$/.test(path)) && /<style[\s>]/i.test(added) && scope.allowStructuralCssOverride !== true) {
    fail('Override estructural nuevo desde layout.tsx bloqueado por defecto.')
  }

  const lines = added.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const window = lines.slice(Math.max(0, index - 2), index + 4).join(' ')
    if (!/<(?:input|textarea|select)\b/i.test(window)) continue
    const light = /bg-(?:white|slate-50|gray-50)|bg-\[#(?:fff|ffffff)\]/i.test(window)
    if (!light) continue
    const darkText = /text-(?:black|slate-[6-9]00|gray-[6-9]00|zinc-[6-9]00|neutral-[6-9]00|stone-[6-9]00)|text-\[#(?:0|1|2|3)/i.test(window)
    const whiteText = /text-white/i.test(window)
    if (!darkText || whiteText) {
      fail('Campo claro nuevo sin texto oscuro explícito: contraste insuficiente.')
      break
    }
  }
}

if (errors.length) {
  console.error('\nVIDA Guardrails bloqueó el commit:\n')
  for (const error of errors) console.error(`- ${error}`)
  console.error('\nCorrige el alcance o el código; no ignores el guardrail.\n')
  process.exit(1)
}

console.log(`[VIDA GUARDRAIL] OK · ${scope.task}`)
console.log(`[VIDA GUARDRAIL] ${changed.length} archivo(s) dentro del alcance.`)
