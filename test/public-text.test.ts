// The published files (src, README, CHANGELOG) must not name internal
// repositories or internal work items. Terms are split so this file does not
// match itself.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url).pathname
const FORBIDDEN = [new RegExp('hive' + 'minds', 'i'), new RegExp('\\bT' + '1\\b'), new RegExp('bes' + 'luit', 'i')]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

describe('public text', () => {
  const targets = [...files(join(root, 'src')), join(root, 'README.md'), join(root, 'CHANGELOG.md')]

  it.each(targets.map((path) => [path.slice(root.length)]))('%s names no internal repo or work item', (relative) => {
    const text = readFileSync(join(root, relative), 'utf8')
    for (const term of FORBIDDEN) expect(text, String(term)).not.toMatch(term)
  })
})
