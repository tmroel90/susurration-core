// Source: hiveminds-playground src/telemetry/families.ts at
// d5f58c6f0ef51ef21b27ac1568c9c8ac600f1ca9. Unchanged apart from two things:
// the playground's own families (self-check, codex-connector) are left out,
// and a consumer can pass its own patterns, evaluated after the scanner path
// check and before the generic families.

export type VisitChannel = 'http' | 'mcp'

export interface FamilyPattern {
  family: string
  pattern: RegExp
}

export interface ClassifyOptions {
  /** Consumer-specific families, evaluated before FAMILY_PATTERNS. */
  patterns?: readonly FamilyPattern[]
}

// Data, not logic: extending the classification is one line here.
export const FAMILY_PATTERNS: readonly FamilyPattern[] = [
  { family: 'oai-searchbot', pattern: /oai-searchbot/i },
  { family: 'chatgpt-user', pattern: /chatgpt-user/i },
  { family: 'gptbot', pattern: /gptbot/i },
  { family: 'claude-user', pattern: /claude-user/i },
  { family: 'claudebot', pattern: /claudebot/i },
  { family: 'perplexity-user', pattern: /perplexity-user/i },
  { family: 'perplexitybot', pattern: /perplexitybot/i },
  { family: 'google-extended', pattern: /google-extended/i },
  { family: 'googlebot', pattern: /googlebot/i },
  { family: 'bingbot', pattern: /bingbot/i },
  { family: 'ccbot', pattern: /ccbot/i },
  { family: 'bytespider', pattern: /bytespider/i },
  { family: 'meta-external', pattern: /meta-external/i },
  { family: 'mcp-crawler', pattern: /brickbluebot/i },
  { family: 'agent-client', pattern: /openai-mcp|trimtabverifier/i },
  {
    family: 'monitor',
    pattern:
      /liveness|health.?(check|probe)|monitor|collector|uptime|probe|scanner|mcp-?watch|mcpscan|scoring|audit|crawler/i,
  },
]

// A scanner signature on the path wins over any UA claim: credential and
// config probes are vulnerability scans no matter what the UA says. A family
// label from a UA is a hypothesis until the path behaviour agrees with it.
export const SCANNER_PATH_PATTERNS: readonly RegExp[] = [
  /^\/@/, // vite/bundler internals: /@vite/env, /@fs/...
  /^\/\./, // dotfile probes: /.env, /.git, /.aws
  /^\/__\//, // framework internals: /__/firebase/init.json
  /id_(rsa|dsa|ecdsa|ed25519)/i,
  /\.(pem|key)$/i,
  /cred|secret|service-principal/i, // creds.json, credentials, gcp-credentials
  /\.php$/i,
  /\.ya?ml$/i, // application.yml, serverless.yml
  /\.env(\.|$)/i, // sendgrid.env, .env.local
  /\/config(\/|$)/i, // /config/anthropic.json, /api/v2/config
  /gradle\.properties/i,
  /wp-(admin|login|content)/i,
  // WordPress sweeps. Deliberately no bare /blog/ pattern: client sites have a /blog.
  /^\/(wp|wordpress)(\/|$)/i,
  /wp-json/i,
]

const BROWSER_PATTERN = /^mozilla\//i

export function classifyAgent(
  userAgent: string | undefined,
  channel: VisitChannel,
  path?: string,
  options: ClassifyOptions = {},
): string {
  if (
    channel === 'http' &&
    path !== undefined &&
    SCANNER_PATH_PATTERNS.some((pattern) => pattern.test(path))
  ) {
    return 'scanner'
  }
  if (userAgent !== undefined) {
    for (const { family, pattern } of [...(options.patterns ?? []), ...FAMILY_PATTERNS]) {
      if (pattern.test(userAgent)) return family
    }
  }
  if (channel === 'mcp') return 'mcp-client'
  if (userAgent !== undefined && BROWSER_PATTERN.test(userAgent)) return 'browser'
  return 'unknown'
}
