import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const behavior = fs.readFileSync('components/biblia/NotebookEditorBehavior.tsx', 'utf8')

test('FASE F: el botón negrita refleja el peso visual real de títulos', () => {
  assert.match(layout, /NotebookEditorBehavior/)
  assert.match(layout, /<NotebookEditorBehavior \/>/)
  assert.match(behavior, /function headingBoldState/)
  assert.match(behavior, /getComputedStyle\(anchor\)\.fontWeight/)
  assert.match(behavior, /numericWeight >= 600/)
  assert.match(behavior, /button\[aria-label="Negrita"\]/)
  assert.match(behavior, /button\.dataset\.headingBoldVisual = active \? 'true' : 'false'/)
  assert.match(behavior, /button\.setAttribute\('aria-pressed', active \? 'true' : 'false'\)/)
  assert.match(behavior, /data-heading-bold-visual="true"/)
  assert.match(behavior, /data-heading-bold-visual="false"/)
  assert.doesNotMatch(behavior, /heading\.style\.setProperty\('font-weight', '400'/)
})
