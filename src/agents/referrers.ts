// Source: Susurration playground, src/telemetry/referrers.ts at
// 6556e103a08e428a6b13870be3f63287d14a5357 (REFERRER_CLASS_PATTERNS and
// classifyReferrer). Unchanged apart from two things: the playground's own
// classes (its own domain and one named partner site) are left out, and a
// consumer passes its own classes as patterns, evaluated before the generic
// ones. The database counter stays in the consumer.
//
// The raw Referer header is classified and discarded: only the class name is
// meant to be stored. 'none' means no header was sent; 'other' is a header that
// matched nothing (or is not a URL).

export interface ReferrerClassPattern {
  class: string
  /** Tested against the hostname of the Referer URL. */
  pattern: RegExp
}

export interface ReferrerOptions {
  /** Consumer-specific classes (for example 'own'), evaluated before REFERRER_CLASS_PATTERNS. */
  patterns?: readonly ReferrerClassPattern[]
}

export const REFERRER_CLASS_PATTERNS: readonly ReferrerClassPattern[] = [
  {
    class: 'catalog',
    pattern:
      /(^|\.)(glama\.ai|smithery\.ai|github\.com|mcp\.so|pulsemcp\.com|mcpservers\.org|registry\.modelcontextprotocol\.io)$/i,
  },
  {
    class: 'search-engine',
    pattern: /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|ecosia\.org|startpage\.com|search\.brave\.com|yandex\.[a-z]+)$/i,
  },
  {
    class: 'ai-assistant',
    pattern:
      /(^|\.)(chatgpt\.com|chat\.openai\.com|claude\.ai|perplexity\.ai|copilot\.microsoft\.com|gemini\.google\.com|poe\.com|you\.com)$/i,
  },
]

export function classifyReferrer(referer: string | undefined, options: ReferrerOptions = {}): string {
  if (referer === undefined || referer.trim() === '') return 'none'
  let hostname: string
  try {
    hostname = new URL(referer).hostname
  } catch {
    return 'other'
  }
  for (const { class: cls, pattern } of [...(options.patterns ?? []), ...REFERRER_CLASS_PATTERNS]) {
    if (pattern.test(hostname)) return cls
  }
  return 'other'
}
