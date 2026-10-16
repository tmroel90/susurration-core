// Test vectors from hiveminds-lens-snapshot at
// 29e86804aca9e02d3a3584a507419a1818a7efb7:
// - "source cases": tests/unit/services/scanner/checks/evaluate_bot_path.spec.ts,
//   taken over literally (Dutch test names as in the source).
// - "RFC 9309 edge cases": every robots.txt input of the parseBlockedAIBots tests in
//   tests/unit/services/scanner/checks/robots_txt.spec.ts, evaluated by the source
//   evaluateBotPath for its seven bot tokens and four paths. The expected verdicts
//   in fixtures/robots-vectors.json are the source's own output.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { evaluateBotPath, type BotPathVerdict } from '../src/robots/index.js'

type Vector = { name: string; robotsTxt: string; token: string; path: string; verdict: BotPathVerdict }

const vectors = (
  JSON.parse(readFileSync(new URL('./fixtures/robots-vectors.json', import.meta.url), 'utf8')) as {
    cases: Vector[]
  }
).cases

describe('source cases', () => {
describe('evaluateBotPath', () => {
  it('staat alles toe bij een lege of ontbrekende regelset', () => {
    expect(evaluateBotPath('', 'GPTBot', '/pagina').allowed).toBe(true)
    expect(evaluateBotPath('User-agent: *\nDisallow:', 'GPTBot', '/pagina').allowed).toBe(true)
  })

  it('blokkeert per token op een volledige-site-disallow', () => {
    const robots = 'User-agent: GPTBot\nDisallow: /'
    const verdict = evaluateBotPath(robots, 'GPTBot', '/pagina')
    expect(verdict.allowed).toBe(false)
    expect(verdict.matchedRule).toBe('Disallow: /')
    expect(verdict.viaWildcard).toBe(false)
    // Een ander token valt onder de (ontbrekende) wildcard en blijft vrij.
    expect(evaluateBotPath(robots, 'ClaudeBot', '/pagina').allowed).toBe(true)
  })

  it('past padspecifieke disallows alleen op dat pad toe', () => {
    const robots = 'User-agent: *\nDisallow: /admin'
    expect(evaluateBotPath(robots, 'GPTBot', '/admin/instellingen').allowed).toBe(false)
    expect(evaluateBotPath(robots, 'GPTBot', '/diensten').allowed).toBe(true)
  })

  it('laat de langste pad-match winnen en bij gelijke lengte Allow', () => {
    const robots = 'User-agent: *\nDisallow: /\nAllow: /publiek'
    expect(evaluateBotPath(robots, 'GPTBot', '/publiek/pagina').allowed).toBe(true)
    expect(evaluateBotPath(robots, 'GPTBot', '/intern').allowed).toBe(false)

    const gelijk = 'User-agent: *\nDisallow: /pad\nAllow: /pad'
    expect(evaluateBotPath(gelijk, 'GPTBot', '/pad/x').allowed).toBe(true)
  })

  it('geeft de eigen groep voorrang op de wildcard-groep', () => {
    const robots = 'User-agent: *\nDisallow: /\n\nUser-agent: Google-Extended\nDisallow:'
    const eigen = evaluateBotPath(robots, 'Google-Extended', '/pagina')
    expect(eigen.allowed).toBe(true)
    const viaWildcard = evaluateBotPath(robots, 'GPTBot', '/pagina')
    expect(viaWildcard.allowed).toBe(false)
    expect(viaWildcard.viaWildcard).toBe(true)
  })

  it('matcht tokens case-insensitive', () => {
    const robots = 'User-agent: gptbot\nDisallow: /'
    expect(evaluateBotPath(robots, 'GPTBot', '/').allowed).toBe(false)
  })

  it('ondersteunt * en $ in paden volgens RFC 9309', () => {
    const robots = 'User-agent: *\nDisallow: /*.pdf$'
    expect(evaluateBotPath(robots, 'GPTBot', '/map/brochure.pdf').allowed).toBe(false)
    expect(evaluateBotPath(robots, 'GPTBot', '/map/brochure.pdf.html').allowed).toBe(true)

    const ster = 'User-agent: *\nDisallow: /zoek*resultaat'
    expect(evaluateBotPath(ster, 'GPTBot', '/zoek/alle/resultaat').allowed).toBe(false)
    expect(evaluateBotPath(ster, 'GPTBot', '/zoekpagina').allowed).toBe(true)
  })
})
})

describe('RFC 9309 edge cases (source output)', () => {
  it('covers all 420 source verdicts', () => {
    expect(vectors).toHaveLength(420)
  })

  it.each(vectors.map((v) => [v.name, v.token, v.path, v] as const))(
    '%s: %s on %s',
    (_name, _token, _path, v) => {
      expect(evaluateBotPath(v.robotsTxt, v.token, v.path)).toEqual(v.verdict)
    },
  )
})
