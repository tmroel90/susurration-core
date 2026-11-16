// Test vectors taken over literally from Susurration playground,
// test/telemetry/telemetry.test.ts at 6556e103a08e428a6b13870be3f63287d14a5357
// (UA_FIXTURES and the "agent classification" block). Core must give the same
// family for every case. The playground's own families (self-check,
// codex-connector) are not in core; the consumer adds them as custom patterns,
// exactly as the playground does, so those cases come out the same too.
import { describe, expect, it } from 'vitest'
import { classifyAgent, orderedFamilyPatterns, type ClassifyOptions } from '../src/agents/index.js'

const PLAYGROUND: ClassifyOptions = {
  patterns: [
    { family: 'self-check', pattern: /susurration-live-check|susurration-stations-sync/i },
    { family: 'codex-connector', pattern: /codex-mcp-client/i, before: 'mcp-crawler' },
  ],
}

// The playground's own FAMILY_PATTERNS at 6556e10, family and regex source in
// order. With the options above, core evaluates exactly this list.
const PLAYGROUND_ORDER: [string, string][] = [
  ['self-check', 'susurration-live-check|susurration-stations-sync'],
  ['oai-searchbot', 'oai-searchbot'],
  ['chatgpt-user', 'chatgpt-user'],
  ['gptbot', 'gptbot'],
  ['claude-user', 'claude-user'],
  ['claudebot', 'claudebot'],
  ['perplexity-user', 'perplexity-user'],
  ['perplexitybot', 'perplexitybot'],
  ['google-extended', 'google-extended'],
  ['googlebot', 'googlebot'],
  ['bingbot', 'bingbot'],
  ['ccbot', 'ccbot'],
  ['bytespider', 'bytespider'],
  ['meta-external', 'meta-external'],
  ['codex-connector', 'codex-mcp-client'],
  ['mcp-crawler', 'brickbluebot'],
  ['agent-client', 'openai-mcp|trimtabverifier'],
  ['skitter', 'skitter|swarmmemo'],
  [
    'monitor',
    'liveness|health.?(check|probe)|monitor|collector|uptime|probe|scanner|mcp-?watch|mcpscan|scoring|audit|crawler',
  ],
  ['declared-agent', '\\b(ai|llm|autonomous)[ _-]?agent\\b'],
]

const UA_FIXTURES: [string, string][] = [
  [
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
    'gptbot',
  ],
  ['Mozilla/5.0; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot', 'oai-searchbot'],
  ['Mozilla/5.0 AppleWebKit/537.36; compatible; ChatGPT-User/1.0; +https://openai.com/bot', 'chatgpt-user'],
  [
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
    'claudebot',
  ],
  ['Mozilla/5.0; Claude-User/1.0; +Claude-User@anthropic.com', 'claude-user'],
  [
    'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
    'perplexitybot',
  ],
  [
    'Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)',
    'perplexity-user',
  ],
  ['Google-Extended/1.0', 'google-extended'],
  ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'googlebot'],
  ['Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', 'bingbot'],
  ['CCBot/2.0 (https://commoncrawl.org/faq/)', 'ccbot'],
  [
    'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
    'bytespider',
  ],
  [
    'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
    'meta-external',
  ],
  [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'browser',
  ],
  ['curl/8.4.0', 'unknown'],
  ['susurration-live-check/1.0', 'self-check'],
  ['susurration-stations-sync/1.0 (+https://roll.susurration.ai/governance)', 'self-check'],
  ['openai-mcp/1.0.0', 'agent-client'],
  ['codex-mcp-client/0.153.4', 'codex-connector'],
  ['TrimtabVerifier/0.1 (+https://trimtabist.com/verifier)', 'agent-client'],
  ['BrickBlueBot/0.1 (+https://brick.blue/bot; agentic-web index)', 'mcp-crawler'],
  ['SentinelOracle/0.1 (+https://glimind.com/opt-out; liveness-only, never invokes tools)', 'monitor'],
  ['zevruna-monitor/1.0 (+https://zevruna.com)', 'monitor'],
  ['rokmcp-collector/0.2 (+https://rokmcp.com/bot)', 'monitor'],
  ['ProofBench/0.1 (+https://proofbench.dev/about/probe; MCP registry health probe)', 'monitor'],
]

describe('source vectors (with the playground patterns)', () => {
  it.each(UA_FIXTURES)('classifies %s as %s', (userAgent, family) => {
    expect(classifyAgent(userAgent, 'http', undefined, PLAYGROUND)).toBe(family)
  })

  it('derives mcp-client from the channel for unrecognised agents', () => {
    expect(classifyAgent('node', 'mcp', undefined, PLAYGROUND)).toBe('mcp-client')
    expect(classifyAgent(undefined, 'mcp', undefined, PLAYGROUND)).toBe('mcp-client')
  })

  it('lets a recognised UA win over the mcp channel', () => {
    expect(classifyAgent(UA_FIXTURES[3]![0], 'mcp', undefined, PLAYGROUND)).toBe('claudebot')
  })

  it('lets a scanner path win over any UA claim (a family label is a hypothesis)', () => {
    const spoofedUa = 'Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)'
    for (const path of [
      '/id_ecdsa',
      '/config.php',
      '/gcp-credentials.json',
      '/service-principal.json',
      '/secret.json',
      '/@vite/env',
      '/@fs/etc/nginx/nginx.conf',
      '/.env',
      '/gradle.properties',
      '/creds.json',
      '/config/anthropic.json',
      '/config/sendgrid.env',
      '/application.yml',
      '/serverless.yml',
      '/api/v2/config',
      '/__/firebase/init.json',
      '/wp/',
      '/wordpress/',
      '/blog/wp-json/batch/v1',
      '/wp-json/wp/v2/users',
    ]) {
      expect(classifyAgent(spoofedUa, 'http', path, PLAYGROUND), path).toBe('scanner')
    }
  })

  it('keeps the UA family on ordinary paths', () => {
    const spoofedUa = 'Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)'
    expect(classifyAgent(spoofedUa, 'http', '/spec', PLAYGROUND)).toBe('perplexity-user')
    expect(classifyAgent('curl/8.4.0', 'http', '/api/flock', PLAYGROUND)).toBe('unknown')
    // Bare /blog/ is deliberately not a scanner signature (Observatory reuse).
    expect(classifyAgent('curl/8.4.0', 'http', '/blog/', PLAYGROUND)).toBe('unknown')
  })
})


// Probe paths seen 19-26 Oct 2026 in the source (same list as its test).
const CONFIG_PROBES_OCT_2026 = [
  '/env', '/env.js', '/env.txt', '/env.bak', '/env-config.js', '/runtime-config.js',
  '/config.js', '/config.json', '/config.json.save', '/app.config.js', '/aws-exports.js',
  '/aws-config.js', '/aws.config.js', '/aws-ses.json', '/settings.json', '/settings.js',
  '/keys.json', '/auth.json', '/firebase.json', '/service-account.json',
  '/phpinfo', '/_profiler/phpinfo', '/_profiler/',
  '/appsettings.json', '/appsettings.Development.json', '/appsettings.Production.json',
  '/Dockerfile', '/wrangler.toml', '/netlify.toml', '/vercel.json', '/next.config.js',
  '/next.config.mjs',
  '/database.sql', '/backup.sql', '/db.sql', '/dump.sql', '/backup.zip', '/backup.tar.gz',
  '/metabase.db', '/metabase.db.mv.db',
  '/wp-config.php.bak', '/wp-config.php.old', '/wp-config.php.save', '/wp-config.php.swp',
  '/wp-config.php.txt', '/wp-config.php~', '/config.php.bak',
  '/composer.json', '/composer.lock', '/vendor/composer/installed.json', '/package.json',
  '/actuator', '/actuator/env', '/actuator/heapdump', '/actuator/gateway/routes',
  '/jolokia', '/jolokia/list', '/heapdump', '/manage/heapdump', '/monitoring/heapdump',
  '/management/actuator/heapdump',
  '/storage/logs/laravel.log', '/artisan',
  '/server-status', '/server-info', '/elmah.axd', '/phpmyadmin', '/pma', '/manager/html',
  '/app/etc/local.xml',
  '/postman_collection.json', '/postman_environment.json',
]

describe('source vectors added after the first release', () => {
  it('classifies the October 2026 config, dump and console probes as scanner, whatever the UA', () => {
    const browserUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15'
    for (const path of CONFIG_PROBES_OCT_2026) {
      expect(classifyAgent(browserUa, 'http', path, PLAYGROUND), path).toBe('scanner')
      expect(classifyAgent(undefined, 'http', path), path).toBe('scanner')
    }
  })

  it('leaves real site routes and ordinary agent discovery paths alone', () => {
    const browserUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
    for (const path of [
      '/', '/start', '/start.md', '/spec', '/spec.md', '/llms.txt', '/llms-full.txt',
      '/robots.txt', '/sitemap.xml', '/feed.xml', '/og.png', '/replay.js', '/styles.css',
      '/healthz', '/health', '/governance', '/observatory', '/whispers', '/about',
      '/api/openapi.json', '/openapi.json', '/swagger.json', '/api-docs.json',
      '/mcp', '/mcp/server-card', '/ai.txt', '/favicon.ico', '/apple-touch-icon.png',
      '/traces/OwhI_pMmilbWzhiXRLHNp', '/traces/6GFED-6wh-CElrxvfzytL',
      '/perspectives/trajectory-v2.1-draft', '/perspectives/gpt-5.6-luna',
      '/proposals/lXSLZQ57qiLi8eAA3VZ2r', '/api/experiments', '/api/traces',
      '/app.js', '/index.js', '/main.js', '/bundle.js', '/admin', '/login', '/dashboard',
      '/docs', '/settings', '/contact', '/blog/', '/environment', '/backup',
    ]) {
      expect(classifyAgent(browserUa, 'http', path, PLAYGROUND), path).toBe('browser')
    }
  })

  it.each([
    ['skitter/1 (SwarmMemo; AI agent)', 'skitter'],
    ['skitter/1', 'skitter'],
    ['skitter-check/1', 'skitter'],
    ['skitter-scout', 'skitter'],
    ['Skitter/2 (+https://swarmmemo.com)', 'skitter'],
    ['acme-runner/0.3 (an autonomous agent)', 'declared-agent'],
    ['Foo/1.0 (LLM-agent; +https://example.org)', 'declared-agent'],
    ['ai_agent/2', 'declared-agent'],
    ['AgentRankProbe/0.1 (+https://spark.tail6ec125.ts.net/developers)', 'monitor'],
    ['allagents-liveness/1 (+https://allagents.app)', 'monitor'],
    ['aiagentboard-hub/1 (+https://aiagentboard.org/about#probe)', 'monitor'],
    ['BrickBlueBot/0.1 (+https://brick.blue/bot?h=susurration.ai; agentic-web registry)', 'mcp-crawler'],
    ['WellknownBot/0.1 (+https://wellknown.network/bot; listing: https://wellknown.network/agents/susurration)', 'unknown'],
    ['AgentToolIndex/1.0 (+https://agenttoolindex.com/method; passive MCP checks: initialize and list calls only)', 'unknown'],
    ['GAIP-Observatory/1.0 (+https://www.gaipagents.com/bots)', 'unknown'],
    ['agentexchange-index/1.0 (+https://index.agentexchange.work; daily independent measurement of the agent economy)', 'unknown'],
    ['AgenticYellowPages/2.0 (+https://agenticyellowpage.com)', 'unknown'],
    ['coda-agent-runtime', 'unknown'],
  ])('classifies self-announcing agents: %s as %s', (userAgent, family) => {
    expect(classifyAgent(userAgent, 'http', '/llms.txt', PLAYGROUND)).toBe(family)
    expect(classifyAgent(userAgent, 'http', '/llms.txt')).toBe(family)
  })
})

describe('evaluation order with consumer patterns', () => {
  it('equals the source list exactly with the playground options (family, regex source, flags)', () => {
    const ordered = orderedFamilyPatterns(PLAYGROUND)
    expect(ordered.map(({ family, pattern }) => [family, pattern.source])).toEqual(PLAYGROUND_ORDER)
    for (const { pattern } of ordered) expect(pattern.flags).toBe('i')
  })

  it('places a pattern with before right in front of that family', () => {
    // A UA that matches both codex-mcp-client and a generic family listed
    // after meta-external keeps the generic family only if it comes first.
    const ua = 'codex-mcp-client/0.1 gptbot'
    expect(classifyAgent(ua, 'http', undefined, PLAYGROUND)).toBe('gptbot')
    expect(classifyAgent('codex-mcp-client/0.1 brickbluebot', 'http', undefined, PLAYGROUND)).toBe('codex-connector')
  })

  it('puts a pattern without before at the front, as in 0.1.0', () => {
    const ordered = orderedFamilyPatterns({ patterns: [{ family: 'mine', pattern: /mine/i }] })
    expect(ordered[0]!.family).toBe('mine')
  })

  it('puts a pattern whose before names no generic family at the front', () => {
    const ordered = orderedFamilyPatterns({ patterns: [{ family: 'mine', pattern: /mine/i, before: 'nope' }] })
    expect(ordered[0]!.family).toBe('mine')
  })

  it('keeps several patterns with the same before in the given order', () => {
    const ordered = orderedFamilyPatterns({
      patterns: [
        { family: 'a', pattern: /a/i, before: 'monitor' },
        { family: 'b', pattern: /b/i, before: 'monitor' },
      ],
    })
    const index = ordered.findIndex((p) => p.family === 'monitor')
    expect(ordered.slice(index - 2, index + 1).map((p) => p.family)).toEqual(['a', 'b', 'monitor'])
  })

  it('without options is FAMILY_PATTERNS', () => {
    expect(orderedFamilyPatterns().map((p) => p.family)).toEqual(PLAYGROUND_ORDER.map(([f]) => f).filter((f) => f !== 'self-check' && f !== 'codex-connector'))
  })
})

describe('generic families without custom patterns', () => {
  it('does not know the playground families', () => {
    expect(classifyAgent('susurration-live-check/1.0', 'http')).toBe('unknown')
    expect(classifyAgent('codex-mcp-client/0.153.4', 'http')).toBe('unknown')
  })

  it('gives the same family as the source for every other vector', () => {
    for (const [userAgent, family] of UA_FIXTURES) {
      if (family === 'self-check' || family === 'codex-connector') continue
      expect(classifyAgent(userAgent, 'http'), userAgent).toBe(family)
    }
  })

  it('falls back to unknown for an unrecognised user agent, and for none', () => {
    expect(classifyAgent('curl/8.4.0', 'http')).toBe('unknown')
    expect(classifyAgent(undefined, 'http')).toBe('unknown')
  })
})

describe('custom patterns', () => {
  it('are evaluated before the generic families', () => {
    const options: ClassifyOptions = { patterns: [{ family: 'house-gpt', pattern: /gptbot/i }] }
    expect(classifyAgent(UA_FIXTURES[0]![0], 'http', '/spec', options)).toBe('house-gpt')
  })

  it('never beat a scanner path signature', () => {
    const options: ClassifyOptions = { patterns: [{ family: 'house-gpt', pattern: /gptbot/i }] }
    expect(classifyAgent(UA_FIXTURES[0]![0], 'http', '/.env', options)).toBe('scanner')
  })
})
