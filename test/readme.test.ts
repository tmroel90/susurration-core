// The README documents exactly the runtime exports per module: each module
// section has one "Exports:" line, and together they must equal
// expected-exports.json, which the exports test and pack-smoke enforce.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
const expected = JSON.parse(
  readFileSync(new URL('./expected-exports.json', import.meta.url), 'utf8'),
) as Record<'agents' | 'robots' | 'verify', string[]>

function documentedExports(module: string): string[] {
  const start = readme.indexOf(`### \`@susurration/core/${module}\``)
  if (start === -1) throw new Error(`no README section for ${module}`)
  const next = readme.indexOf('\n### ', start + 1)
  const section = readme.slice(start, next === -1 ? undefined : next)
  const line = section.split('\n').find((l) => l.startsWith('Exports:'))
  if (line === undefined) throw new Error(`no Exports line for ${module}`)
  return [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]!).sort()
}

describe('README', () => {
  it.each(['agents', 'robots', 'verify'] as const)('lists exactly the %s exports', (module) => {
    expect(documentedExports(module)).toEqual([...expected[module]].sort())
  })

  it('has no em dashes', () => {
    expect(readme).not.toContain('—')
  })

  it('links to the governance page', () => {
    expect(readme).toContain('https://susurration.ai/governance')
  })
})
