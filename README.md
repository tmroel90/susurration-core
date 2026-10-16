# @susurration/core

The measurement rules that Susurration's tools share, as a small TypeScript package. It answers three questions about a visit: which agent is this (`agents`), may it come here according to robots.txt (`robots`), and is this record the same as another one (`verify`). The code has no network, file or database access, so anyone can run it on the same input and check a published result.

Requires Node 22 or later. `zod` 4 is a peer dependency (used by the agent list schema).

```sh
npm install @susurration/core zod
```

Everything can be imported from the root, or from one of the three subpaths below.

## Modules

### `@susurration/core/agents`

The canonical list of AI agents and the classification of a visitor into a family.

- `BOT_AGENT_LIST` holds 15 agents. Each agent has a key, a label, a category (`training`, `search`, `userfetch` or `control`), its robots.txt token, its user agent string, whether it is declarative-only, a source URL, a verification date and a note. The notes are in Dutch, as in the source list. Where one family belongs to an agent one to one, the agent also has a `family`.
- `classifyAgent(userAgent, channel, path?, options?)` returns a family name. A path that looks like a vulnerability scan (for example `/.env` or `/wp-admin`) gives `scanner`, whatever the user agent says. Otherwise the user agent is matched against your own `options.patterns` first and then against `FAMILY_PATTERNS`. Without a match the result is `mcp-client` on the `mcp` channel, `browser` for a user agent that starts with `Mozilla/`, and `unknown` otherwise.
- `botAgentSchema` and `botAgentListSchema` are the Zod schemas the list validates against.
- `AGENT_LIST_VERSION` is the date of the last change in content to the list or its families.

```ts
import { BOT_AGENT_LIST, classifyAgent } from '@susurration/core/agents'

classifyAgent('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot', 'http', '/products')
// 'gptbot'

classifyAgent('my-monitor/1.0', 'http', '/', {
  patterns: [{ family: 'own-monitor', pattern: /my-monitor/i }],
})
// 'own-monitor'

BOT_AGENT_LIST.agents.filter((agent) => agent.category === 'userfetch').map((agent) => agent.key)
// ['chatgpt-user', 'claude-user', 'perplexity-user']
```

Exports: `BOT_AGENT_LIST`, `AGENT_LIST_VERSION`, `FAMILY_PATTERNS`, `SCANNER_PATH_PATTERNS`, `botAgentSchema`, `botAgentListSchema`, `classifyAgent`

Types: `BotAgent`, `BotAgentList`, `BotCategory`, `ClassifyOptions`, `FamilyPattern`, `VisitChannel`

### `@susurration/core/robots`

`evaluateBotPath(robotsTxt, botToken, path)` decides whether a bot token may fetch a path under a robots.txt file, following RFC 9309:

- The group whose user-agent value is the longest prefix of the token wins. The `*` group applies only when no group names the token.
- Within the winning group, the longest matching rule wins. On equal length, `Allow` wins.
- `*` matches any characters and a trailing `$` anchors the end of the path.
- No matching rule means allowed.

The result says whether the path is allowed, which rule decided it, and whether the `*` group was used.

```ts
import { evaluateBotPath } from '@susurration/core/robots'

evaluateBotPath('User-agent: *\nDisallow: /\nAllow: /public', 'GPTBot', '/public/page')
// { allowed: true, matchedRule: 'Allow: /public', viaWildcard: true }
```

Exports: `evaluateBotPath`

Types: `BotPathVerdict`

### `@susurration/core/verify`

- `stableStringify(value)` writes JSON with object keys sorted at every level and arrays kept in order. Two records with the same values give the same string, whatever their key order.
- `canonicalHash(value)` is the sha256 hex digest of `stableStringify(value)`.
- `CORE_VERSION` is the version of this package, so a report can state which version produced it.

```ts
import { canonicalHash, stableStringify } from '@susurration/core/verify'

stableStringify({ b: 1, a: [2, 1] })
// '{"a":[2,1],"b":1}'

canonicalHash({ b: 1, a: 2 }) === canonicalHash({ a: 2, b: 1 })
// true
```

Exports: `CORE_VERSION`, `canonicalHash`, `stableStringify`

## Versioning

This package follows semantic versioning, with one stricter rule: any change in content to the agent list or to the classification rules is at least a minor version, never a patch. Results computed with two versions that differ in those rules are not directly comparable, and the minor version makes that visible. A patch only changes code without changing any result.

## Where the rules come from

The agent list and the robots.txt evaluation come from Lens. The family classification and `stableStringify` come from the Susurration playground. Both use these rules in production. Each module states the source file and revision it was copied from. The tests check that this package gives the same results as the source: on the source's own test cases, and for `stableStringify`, which had no tests in the source, on a set of inputs run through the source implementation.

The package is public because of house rule 3 of the Susurration governance, "same method, public and paid": https://susurration.ai/governance

## Licence

Apache-2.0. See [LICENSE](LICENSE).
