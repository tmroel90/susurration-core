// Packs the package, installs the tarball into an empty temporary project and
// imports every public entry point from there, so a file missing from the
// published tarball fails CI. Run after `npm run build`.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const expected = JSON.parse(readFileSync(join(root, 'test/expected-exports.json'), 'utf8'))
const dir = mkdtempSync(join(tmpdir(), 'core-pack-smoke-'))

try {
  const [packed] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', dir], { cwd: root, encoding: 'utf8' }),
  )
  console.log(`packed ${packed.filename}: ${packed.files.map((f) => f.path).join(', ')}`)

  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'smoke', private: true, type: 'module' }))
  execFileSync('npm', ['install', '--no-audit', '--no-fund', join(dir, packed.filename)], {
    cwd: dir,
    stdio: 'inherit',
  })

  const entries = {
    '@susurration/core': [...expected.agents, ...expected.robots, ...expected.verify],
    '@susurration/core/agents': expected.agents,
    '@susurration/core/robots': expected.robots,
    '@susurration/core/verify': expected.verify,
  }
  const check = `
const entries = ${JSON.stringify(entries)}
for (const [specifier, names] of Object.entries(entries)) {
  const mod = await import(specifier)
  const actual = Object.keys(mod).sort()
  const want = [...names].sort()
  if (JSON.stringify(actual) !== JSON.stringify(want)) {
    throw new Error(specifier + ' exports ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(want))
  }
  console.log('ok ' + specifier + ' (' + actual.length + ' exports)')
}
`
  writeFileSync(join(dir, 'check.mjs'), check)
  execFileSync('node', ['check.mjs'], { cwd: dir, stdio: 'inherit' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
