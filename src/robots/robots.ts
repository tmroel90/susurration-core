// Source: Lens, app/services/scanner/checks/robots_txt.ts at
// 29e86804aca9e02d3a3584a507419a1818a7efb7: evaluateBotPath and the pure
// functions it uses, without the network code. Comments translated to English.

const WILDCARD_AGENT = '*'

/**
 * A robots.txt group as RFC 9309 defines it: one or more consecutive
 * User-agent lines followed by a block of rules. Agents are stored lowercased
 * for case-insensitive matching.
 */
interface RobotsGroup {
  agents: string[]
  disallows: string[]
  allows: string[]
}

/**
 * Group selection per RFC 9309: the longest user-agent value that matches as a
 * prefix of the bot name wins; the wildcard group is the fallback when no group
 * names the bot.
 */
function selectGroups(
  groups: RobotsGroup[],
  botLower: string
): { winning: RobotsGroup[]; viaWildcard: boolean } {
  let bestLength = 0
  for (const group of groups) {
    for (const agent of group.agents) {
      if (agent !== WILDCARD_AGENT && botLower.startsWith(agent) && agent.length > bestLength) {
        bestLength = agent.length
      }
    }
  }

  const winning = groups.filter((group) =>
    group.agents.some((agent) =>
      bestLength > 0
        ? agent !== WILDCARD_AGENT && botLower.startsWith(agent) && agent.length === bestLength
        : agent === WILDCARD_AGENT
    )
  )
  return { winning, viaWildcard: bestLength === 0 }
}

export interface BotPathVerdict {
  allowed: boolean
  matchedRule: string | null
  viaWildcard: boolean
}

/**
 * Verdict per token and path according to RFC 9309: group selection as above,
 * then within the winning group(s) the longest matching path rule wins, and on
 * equal length the least restrictive one (Allow). Paths support '*' as a
 * wildcard and a trailing '$' as an end anchor. No matching rule means allowed.
 */
export function evaluateBotPath(robotsTxt: string, botToken: string, path: string): BotPathVerdict {
  const { winning, viaWildcard } = selectGroups(parseGroups(robotsTxt), botToken.toLowerCase())
  if (winning.length === 0) return { allowed: true, matchedRule: null, viaWildcard: false }

  type Rule = { type: 'allow' | 'disallow'; value: string }
  const rules: Rule[] = winning.flatMap((group) => [
    ...group.disallows.filter((v) => v !== '').map((value): Rule => ({ type: 'disallow', value })),
    ...group.allows.filter((v) => v !== '').map((value): Rule => ({ type: 'allow', value })),
  ])

  let best: Rule | null = null
  for (const rule of rules) {
    if (!rulePathMatches(rule.value, path)) continue
    if (
      !best ||
      rule.value.length > best.value.length ||
      (rule.value.length === best.value.length && rule.type === 'allow' && best.type === 'disallow')
    ) {
      best = rule
    }
  }

  if (!best) return { allowed: true, matchedRule: null, viaWildcard }
  return {
    allowed: best.type === 'allow',
    matchedRule: `${best.type === 'allow' ? 'Allow' : 'Disallow'}: ${best.value}`,
    viaWildcard,
  }
}

/** Path match per RFC 9309: prefix match with '*' as a wildcard and a trailing '$' as an anchor. */
function rulePathMatches(rule: string, path: string): boolean {
  const anchored = rule.endsWith('$')
  const core = anchored ? rule.slice(0, -1) : rule
  const escaped = core
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')
  return new RegExp(`^${escaped}${anchored ? '$' : ''}`).test(path)
}

/**
 * Parses robots.txt into groups. Several User-agent lines directly above a rule
 * block form one group; a User-agent line after a rule line starts a new group.
 * Comments (also inline) and blank lines are ignored and do not break a group.
 */
function parseGroups(robotsTxt: string): RobotsGroup[] {
  const groups: RobotsGroup[] = []
  let current: RobotsGroup | null = null
  let acceptingAgents = false

  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim()
    if (line === '') continue

    const userAgentMatch = line.match(/^User-agent:\s*(.*)$/i)
    if (userAgentMatch) {
      const agent = userAgentMatch[1].trim().toLowerCase()
      if (agent === '') continue
      if (!current || !acceptingAgents) {
        current = { agents: [], disallows: [], allows: [] }
        groups.push(current)
        acceptingAgents = true
      }
      current.agents.push(agent)
      continue
    }

    const disallowMatch = line.match(/^Disallow:\s*(.*)$/i)
    if (disallowMatch && current) {
      acceptingAgents = false
      current.disallows.push(disallowMatch[1].trim())
      continue
    }

    const allowMatch = line.match(/^Allow:\s*(.*)$/i)
    if (allowMatch && current) {
      acceptingAgents = false
      current.allows.push(allowMatch[1].trim())
      continue
    }

    // Other directives (Crawl-delay, Sitemap, ...) close the User-agent list of
    // the current group, so a following User-agent line starts a new group.
    acceptingAgents = false
  }

  return groups
}
