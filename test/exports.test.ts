import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as root from '../src/index.js'
import * as agents from '../src/agents/index.js'
import * as robots from '../src/robots/index.js'
import * as verify from '../src/verify/index.js'

// The export list is the single source shared with scripts/pack-smoke.mjs.
const expected = JSON.parse(
  readFileSync(new URL('./expected-exports.json', import.meta.url), 'utf8'),
) as Record<'agents' | 'robots' | 'verify', string[]>

const sorted = (names: string[]): string[] => [...names].sort()

describe('exports', () => {
  it.each([
    ['agents', agents],
    ['robots', robots],
    ['verify', verify],
  ] as const)('the %s subpath exports exactly the documented names', (name, mod) => {
    expect(sorted(Object.keys(mod))).toEqual(sorted(expected[name]))
  })

  it('the root re-exports every subpath and nothing else', () => {
    expect(sorted(Object.keys(root))).toEqual(
      sorted([...expected.agents, ...expected.robots, ...expected.verify]),
    )
  })
})
