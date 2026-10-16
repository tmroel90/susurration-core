// Tells the publish workflow whether the version in package.json is already
// on npm, so a tag for a version that was published by hand ends green.
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'

const PACKAGE = '@susurration-ai/core'

/** True when `npm view <package>@<version> version` prints exactly that version. */
export function alreadyPublished(version, view) {
  try {
    return view(`${PACKAGE}@${version}`).trim() === version
  } catch {
    return false
  }
}

function npmView(spec) {
  return execFileSync('npm', ['view', spec, 'version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const published = alreadyPublished(version, npmView)
  console.log(
    published
      ? `${PACKAGE}@${version} is already on npm: publish skipped.`
      : `${PACKAGE}@${version} is not on npm yet: publishing.`,
  )
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `skip=${published}\n`)
}
