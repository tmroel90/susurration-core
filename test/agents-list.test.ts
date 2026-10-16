// The agent list must be deep-equal to the source list, apart from the added
// `family` field and the four notes below. Source: Lens,
// resources/access/bot_agents.json at 29e86804aca9e02d3a3584a507419a1818a7efb7,
// copied to test/fixtures/bot_agents.json without its top-level `comment` (not
// list content) and with the same four notes changed. The block "source
// invariants" takes over the list cases of Lens
// tests/unit/services/access_audit/agents.spec.ts at the same sha (the
// `loadBotAgents` block, and the token count of `declarativeTokens`). The
// schema rejection cases are our own: the source has no tests for them.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AGENT_LIST_VERSION,
  BOT_AGENT_LIST,
  FAMILY_PATTERNS,
  botAgentListSchema,
  classifyAgent,
} from '../src/agents/index.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/bot_agents.json', import.meta.url), 'utf8'),
) as unknown

function withoutFamily(list: typeof BOT_AGENT_LIST): unknown {
  return {
    verifiedAt: list.verifiedAt,
    agents: list.agents.map((agent) => {
      const { family: _family, ...rest } = agent as typeof agent & { family?: string }
      return rest
    }),
  }
}

// The only change to the source text: four notes referred to internal work
// items. In each, "T1 PR 3 (5 okt 2026)" became "5 okt 2026" and
// " (besluit V2)" was removed. Old and new text, literally:
const OLD_TAIL =
  'Sinds T1 PR 3 (5 okt 2026) alleen declaratief: gespoofte verzoeken met deze UA provoceerden WAF-greylists op het meet-IP (besluit V2). UA-string blijft als data bewaard.'
const NEW_TAIL =
  'Sinds 5 okt 2026 alleen declaratief: gespoofte verzoeken met deze UA provoceerden WAF-greylists op het meet-IP. UA-string blijft als data bewaard.'
const CHANGED_NOTES: Record<string, { old: string; new: string }> = {
  ccbot: { old: OLD_TAIL, new: NEW_TAIL },
  'meta-externalagent': { old: OLD_TAIL, new: NEW_TAIL },
  amazonbot: {
    old: `Amazon documenteert een voorbeeldformaat met variabele Chrome-versie; dit is de breed in logs waargenomen klassieke string met token en verificatie-URL. ${OLD_TAIL}`,
    new: `Amazon documenteert een voorbeeldformaat met variabele Chrome-versie; dit is de breed in logs waargenomen klassieke string met token en verificatie-URL. ${NEW_TAIL}`,
  },
  bytespider: {
    old: `ByteDance heeft geen officiele documentatiepagina; string zoals breed in serverlogs waargenomen. ${OLD_TAIL}`,
    new: `ByteDance heeft geen officiele documentatiepagina; string zoals breed in serverlogs waargenomen. ${NEW_TAIL}`,
  },
}

describe('changed notes', () => {
  it('changes exactly these four notes, and only the internal references in them', () => {
    const changed = BOT_AGENT_LIST.agents.filter((agent) => agent.key in CHANGED_NOTES)
    expect(changed.map((agent) => agent.key).sort()).toEqual(Object.keys(CHANGED_NOTES).sort())
    for (const agent of changed) {
      const { old, new: replacement } = CHANGED_NOTES[agent.key]!
      expect(agent.note).toBe(replacement)
      expect(
        old.replace('T1 PR 3 (5 okt 2026)', '5 okt 2026').replace(' (besluit V2)', ''),
      ).toBe(replacement)
    }
  })
})

describe('source invariants', () => {
  const agents = BOT_AGENT_LIST.agents

  it('holds the full list with unique keys', () => {
    expect(agents.length).toBe(15)
    const keys = agents.map((a) => a.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has the agreed number of agents per category', () => {
    const byCategory = (cat: string) => agents.filter((a) => a.category === cat)
    expect(byCategory('training').length).toBe(7)
    expect(byCategory('search').length).toBe(3)
    expect(byCategory('userfetch').length).toBe(3)
    expect(byCategory('control').length).toBe(2)
  })

  it('marks Google-Extended as declarative-only, without a user agent', () => {
    const googleExtended = agents.find((a) => a.key === 'google-extended')
    expect(googleExtended).toBeDefined()
    expect(googleExtended!.declarativeOnly).toBe(true)
    expect(googleExtended!.userAgent).toBeNull()
    expect(googleExtended!.robotsToken).toBe('Google-Extended')
  })

  it('gives every agent a source URL and a verification date', () => {
    for (const agent of agents) {
      expect(agent.source).toMatch(/^https:\/\//)
      expect(agent.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('contains the verified vendor strings', () => {
    const ua = (key: string) => agents.find((a) => a.key === key)?.userAgent ?? ''
    expect(ua('gptbot')).toContain('GPTBot/1.4')
    expect(ua('oai-searchbot')).toContain('OAI-SearchBot/1.4')
    expect(ua('claudebot')).toContain('ClaudeBot/1.0')
    expect(ua('claude-searchbot')).toContain('Claude-SearchBot/1.0')
    expect(ua('perplexity-user')).toContain('Perplexity-User/1.0')
  })

  it('has 14 robots tokens: every agent except the browser control', () => {
    const tokens = agents
      .map((a): string | null => a.robotsToken)
      .filter((t): t is string => t !== null)
    expect(tokens).toContain('Google-Extended')
    expect(tokens).toContain('Googlebot')
    expect(tokens).toContain('GPTBot')
    expect(tokens.every((t) => t.length > 0)).toBe(true)
    expect(tokens.length).toBe(14)
  })
})

describe('agent list', () => {
  it('is deep-equal to the source list apart from family', () => {
    expect(withoutFamily(BOT_AGENT_LIST)).toEqual(fixture)
  })

  it('validates against the schema', () => {
    expect(() => botAgentListSchema.parse(BOT_AGENT_LIST)).not.toThrow()
  })

  it('holds the 15 agents of the source in source order', () => {
    expect(BOT_AGENT_LIST.agents.map((agent) => agent.key)).toEqual([
      'control-browser',
      'control-googlebot',
      'gptbot',
      'claudebot',
      'ccbot',
      'meta-externalagent',
      'amazonbot',
      'bytespider',
      'google-extended',
      'oai-searchbot',
      'perplexitybot',
      'claude-searchbot',
      'chatgpt-user',
      'claude-user',
      'perplexity-user',
    ])
  })

  it('rejects an agent without a user agent that is not declarative-only', () => {
    const broken = structuredClone(fixture) as { agents: Record<string, unknown>[] }
    broken.agents[0]!.userAgent = null
    expect(() => botAgentListSchema.parse(broken)).toThrow()
  })

  it('rejects duplicate keys', () => {
    const broken = structuredClone(fixture) as { agents: Record<string, unknown>[] }
    broken.agents.push({ ...broken.agents[0]! })
    expect(() => botAgentListSchema.parse(broken)).toThrow()
  })

  it('rejects an unknown category and a malformed date', () => {
    const badCategory = structuredClone(fixture) as { agents: Record<string, unknown>[] }
    badCategory.agents[0]!.category = 'other'
    expect(() => botAgentListSchema.parse(badCategory)).toThrow()
    const badDate = structuredClone(fixture) as { verifiedAt: string }
    badDate.verifiedAt = '7 August 2026'
    expect(() => botAgentListSchema.parse(badDate)).toThrow()
  })

  it('links agents to generic families one to one', () => {
    const families = Object.fromEntries(
      BOT_AGENT_LIST.agents.map((agent) => [
        agent.key,
        (agent as { family?: string }).family ?? null,
      ]),
    )
    expect(families).toEqual({
      'control-browser': null,
      'control-googlebot': 'googlebot',
      gptbot: 'gptbot',
      claudebot: 'claudebot',
      ccbot: 'ccbot',
      'meta-externalagent': 'meta-external',
      amazonbot: null,
      bytespider: 'bytespider',
      'google-extended': 'google-extended',
      'oai-searchbot': 'oai-searchbot',
      perplexitybot: 'perplexitybot',
      'claude-searchbot': null,
      'chatgpt-user': 'chatgpt-user',
      'claude-user': 'claude-user',
      'perplexity-user': 'perplexity-user',
    })
    const generic = new Set(FAMILY_PATTERNS.map((pattern) => pattern.family))
    for (const family of Object.values(families)) {
      if (family !== null) expect(generic.has(family), family).toBe(true)
    }
  })

  it('classifies each linked agent as its family (user agent, or robots token without one)', () => {
    for (const agent of BOT_AGENT_LIST.agents) {
      const family = (agent as { family?: string }).family
      if (family === undefined) continue
      const probe = agent.userAgent ?? agent.robotsToken ?? undefined
      expect(classifyAgent(probe, 'http'), agent.key).toBe(family)
    }
  })

  it('has an ISO date as list version', () => {
    expect(AGENT_LIST_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
