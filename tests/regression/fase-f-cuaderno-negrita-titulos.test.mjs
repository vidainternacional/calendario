import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const behavior = fs.readFileSync('components/biblia/NotebookEditorBehavior.tsx', 'utf8')

test('FASE F: negrita explícita no se confunde con el peso visual de títulos', () => {
  assert.match(layout, /NotebookEditorBehavior/)
  assert.match(layout, /<NotebookEditorBehavior \/>/)
  assert.match(behavior, /button\[aria-label="Negrita"\]/)
  assert.match(behavior, /closest<HTMLElement>\('h1,h2,h3'\)/)
  assert.match(behavior, /heading\.style\.setProperty\('font-weight', '400', 'important'\)/)
  assert.match(behavior, /requestAnimationFrame\(\(\) => \{\s*requestAnimationFrame/)
  assert.match(behavior, /heading\.style\.removeProperty\('font-weight'\)/)
  assert.match(behavior, /\.note-rich-editor h1 strong/)
  assert.match(behavior, /font-weight: 900 !important/)
})
