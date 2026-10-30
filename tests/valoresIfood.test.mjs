import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Exercise the same pure TypeScript helpers used by the UI, without browser or extra test dependencies.
const source = await readFile(new URL('../src/servicos/valoresIfood.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
const helpers = {}
new Function('exports', outputText)(helpers)

test('Handshake minor units are displayed as reais', () => {
  assert.equal(helpers.reaisDoHandshake('800'), 8)
  assert.equal(helpers.reaisDoHandshake('1250'), 12.5)
  assert.equal(helpers.reaisDoHandshake('1'), 0.01)
  assert.equal(helpers.reaisDoHandshake('0'), 0)
  assert.equal(helpers.reaisDoHandshake('12.50'), 0)
  assert.equal(helpers.reaisDoHandshake('9007199254740992'), 0)
})

test('tracking ETA numbers are durations, with elapsed time, zero and delay handled', () => {
  const reference = Date.parse('2026-10-27T12:00:00Z')
  assert.equal(helpers.previsaoEmSegundos(120, reference, reference), 'Em 2 min')
  assert.equal(helpers.previsaoEmSegundos(600, reference, reference), 'Em 10 min')
  assert.equal(helpers.previsaoEmSegundos(120, reference, reference + 60_000), 'Em 1 min')
  assert.equal(helpers.previsaoEmSegundos(0, reference, reference), 'Horário previsto atingido')
  assert.equal(helpers.previsaoEmSegundos(-300, reference, reference), 'Atrasada em 5 min')
  assert.equal(helpers.previsaoEmSegundos(null, reference, reference), null)
  assert.equal(helpers.previsaoEmSegundos(undefined, reference, reference), null)
  assert.equal(helpers.previsaoEmSegundos('120', reference, reference), null)
  assert.equal(helpers.previsaoEmSegundos(120, NaN, reference), null)
})
