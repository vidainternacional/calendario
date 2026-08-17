import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const router = fs.readFileSync('lib/ai/vida-ai.ts', 'utf8')
const route = fs.readFileSync('app/api/admin/ai-diagnostics/route.ts', 'utf8')

test('Kimi acepta el nombre canónico y el alias legado de Moonshot', () => {
  assert.match(router, /MOONSHOT_API_KEY \|\| process\.env\.MOONSHOOT_API_KEY/)
  assert.match(route, /MOONSHOT_API_KEY \|\| process\.env\.MOONSHOOT_API_KEY/)
})

test('el alias legado permanece solo en servidor', () => {
  assert.doesNotMatch(router, /NEXT_PUBLIC_MOONSHOOT_API_KEY|NEXT_PUBLIC_MOONSHOT_API_KEY/)
  assert.doesNotMatch(route, /NEXT_PUBLIC_MOONSHOOT_API_KEY|NEXT_PUBLIC_MOONSHOT_API_KEY/)
})
