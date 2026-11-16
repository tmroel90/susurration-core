// Source: Susurration playground, src/telemetry/families.ts at
// 6556e103a08e428a6b13870be3f63287d14a5357 (0.1.0 followed d5f58c6f). Unchanged
// apart from two things: the playground's own families (self-check,
// codex-connector) and its household lists are left out, and a consumer can
// pass its own patterns, evaluated after the scanner path check and before the
// generic families, or right in front of a generic family named in `before`.

export type VisitChannel = 'http' | 'mcp'

export interface FamilyPattern {
  family: string
  pattern: RegExp
  /**
   * Only for a consumer pattern: the generic family it is evaluated right in
   * front of. Without it, or when no generic family has that name, the
   * pattern goes before all of FAMILY_PATTERNS.
   */
  before?: string
}

export interface ClassifyOptions {
  /** Consumer-specific families, evaluated before FAMILY_PATTERNS or before the family named in `before`. */
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
  // A named agent that changed its UA per request (24 Oct 2026). The name wins
  // over declared-agent below.
  { family: 'skitter', pattern: /skitter|swarmmemo/i },
  {
    family: 'monitor',
    pattern:
      /liveness|health.?(check|probe)|monitor|collector|uptime|probe|scanner|mcp-?watch|mcpscan|scoring|audit|crawler/i,
  },
  // Agents that announce themselves as one in their UA. After monitor, so a
  // checker that calls itself an agent probe stays a monitor. A bot URL alone
  // is not enough: in Oct 2026 those were almost all indexers and checkers.
  { family: 'declared-agent', pattern: /\b(ai|llm|autonomous)[ _-]?agent\b/i },
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
  // Config, dump and console probes, seen 19-26 Oct 2026. Anchored at the root
  // and named file by file: generic names a client site may really serve
  // (/app.js, /index.js, /admin, /login, /backup) stay out, as /blog/ does above.
  /^\/env$/i,
  /^\/(env|env-config|runtime-config|config|app\.config|aws-exports|aws-config|aws\.config|aws-ses|settings|keys|auth|firebase|service-account)\.(js|json|txt|bak)(\.save)?$/i,
  /phpinfo/i,
  /^\/_profiler(\/|$)/i,
  /^\/appsettings(\.[\w-]+)?\.json$/i, // .NET: appsettings.Production.json
  /^\/(dockerfile|wrangler\.toml|netlify\.toml|vercel\.json|next\.config\.m?js)$/i,
  /\.sql(\.gz)?$/i, // database.sql, dump.sql
  /\.db$/i, // metabase.db, metabase.db.mv.db
  /^\/backup\.(zip|tar\.gz|tgz)$/i,
  /\.(bak|old|orig|save|swp)$|~$/i, // editor and backup copies: wp-config.php.bak, wp-config.php~
  /\.php\.txt$/i,
  /^\/(composer\.(json|lock)|package\.json|vendor\/composer\/installed\.json)$/i,
  /^\/(actuator|jolokia)(\/|$)/i, // Spring Boot
  /heapdump|threaddump/i,
  /^\/storage\/logs\/|^\/artisan$/i, // Laravel
  /^\/(server-status|server-info|elmah\.axd|phpmyadmin|pma)(\/|$)/i,
  /^\/manager\/html/i, // Tomcat
  /^\/app\/etc\/local\.xml$/i, // Magento
  /postman_(collection|environment)\.json$/i,
]

const BROWSER_PATTERN = /^mozilla\//i

/**
 * The family patterns in the order classifyAgent evaluates them: consumer
 * patterns without a (known) `before` first, in the given order; then
 * FAMILY_PATTERNS, with every consumer pattern that names a generic family in
 * `before` placed right in front of that family, in the given order.
 */
export function orderedFamilyPatterns(options: ClassifyOptions = {}): FamilyPattern[] {
  const own = options.patterns ?? []
  const generic = new Set(FAMILY_PATTERNS.map((p) => p.family))
  const placed = (p: FamilyPattern): boolean => p.before !== undefined && generic.has(p.before)
  const ordered: FamilyPattern[] = own.filter((p) => !placed(p))
  for (const entry of FAMILY_PATTERNS) {
    ordered.push(...own.filter((p) => placed(p) && p.before === entry.family), entry)
  }
  return ordered
}

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
    for (const { family, pattern } of orderedFamilyPatterns(options)) {
      if (pattern.test(userAgent)) return family
    }
  }
  if (channel === 'mcp') return 'mcp-client'
  if (userAgent !== undefined && BROWSER_PATTERN.test(userAgent)) return 'browser'
  return 'unknown'
}
