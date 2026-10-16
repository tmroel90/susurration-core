// stableStringify had no unit test in the source; these are the first. The
// vectors in fixtures/stable-vectors.json are the output of the source
// stableStringify (Susurration playground, src/api/serialize.ts at
// d5f58c6f0ef51ef21b27ac1568c9c8ac600f1ca9) on fixtures/stable-inputs.ts, with
// the sha256 hex digest of each output.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CORE_VERSION, canonicalHash, stableStringify } from '../src/verify/index.js'
import { STABLE_INPUTS } from './fixtures/stable-inputs.js'

const vectors = (
  JSON.parse(readFileSync(new URL('./fixtures/stable-vectors.json', import.meta.url), 'utf8')) as {
    cases: { name: string; stable: string; sha256: string }[]
  }
).cases

describe('stableStringify', () => {
  it('ignores key order', () => {
    expect(stableStringify({ b: 2, a: 1 })).toBe(stableStringify({ a: 1, b: 2 }))
    expect(stableStringify({ b: 2, a: 1 })).toBe('{"a":1,"b":2}')
  })

  it('sorts keys at every level of nested objects and arrays', () => {
    expect(stableStringify({ z: { y: 1, x: [{ b: 1, a: 2 }] }, a: 0 })).toBe(
      '{"a":0,"z":{"x":[{"a":2,"b":1}],"y":1}}',
    )
  })

  it('keeps the order of arrays', () => {
    expect(stableStringify([3, 1, 2])).toBe('[3,1,2]')
    expect(stableStringify([3, 1, 2])).not.toBe(stableStringify([1, 2, 3]))
  })

  it('serialises primitives like JSON.stringify', () => {
    for (const value of [null, true, 0, -12.5, 'a "q"']) {
      expect(stableStringify(value)).toBe(JSON.stringify(value))
    }
  })

  it('covers every source vector', () => {
    expect(vectors).toHaveLength(STABLE_INPUTS.length)
  })

  it.each(STABLE_INPUTS.map(([name, value], i) => [name, value, vectors[i]!] as const))(
    'equals the source on %s',
    (name, value, vector) => {
      expect(vector.name).toBe(name)
      expect(stableStringify(value)).toBe(vector.stable)
    },
  )
})

describe('canonicalHash', () => {
  it('is the sha256 hex digest of stableStringify', () => {
    const value = { b: [1, 2], a: 'x' }
    expect(canonicalHash(value)).toBe(
      createHash('sha256').update(stableStringify(value)).digest('hex'),
    )
    expect(canonicalHash(value)).toMatch(/^[a-f0-9]{64}$/)
  })

  it('does not depend on key order', () => {
    expect(canonicalHash({ b: 2, a: 1 })).toBe(canonicalHash({ a: 1, b: 2 }))
  })

  it.each(STABLE_INPUTS.map(([name, value], i) => [name, value, vectors[i]!] as const))(
    'equals sha256 over the source output on %s',
    (_name, value, vector) => {
      expect(canonicalHash(value)).toBe(vector.sha256)
    },
  )
})

describe('CORE_VERSION', () => {
  it('equals the version in package.json', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      version: string
    }
    expect(CORE_VERSION).toBe(pkg.version)
  })
})
