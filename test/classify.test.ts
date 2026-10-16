// Test vectors taken over literally from hiveminds-playground
// test/telemetry/telemetry.test.ts at d5f58c6f0ef51ef21b27ac1568c9c8ac600f1ca9
// (UA_FIXTURES and the "agent classification" block). Core must give the same
// family for every case. The playground's own families (self-check,
// codex-connector) are not in core; the consumer adds them as custom patterns,
// exactly as the playground will, so those cases come out the same too.
import { describe, expect, it } from 'vitest'
import { classifyAgent, type ClassifyOptions } from '../src/agents/index.js'

const PLAYGROUND: ClassifyOptions = {
  patterns: [
    { family: 'self-check', pattern: /susurration-live-check/i },
    { family: 'codex-connector', pattern: /codex-mcp-client/i },
  ],
}

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
