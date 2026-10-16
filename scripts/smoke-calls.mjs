// One call per public export, run by pack-smoke against the installed tarball.
// Every exported name needs an entry here; pack-smoke fails on a missing one.
export const smokeCalls = {
  AGENT_LIST_VERSION: (m) => /^\d{4}-\d{2}-\d{2}$/.test(m.AGENT_LIST_VERSION),
  BOT_AGENT_LIST: (m) => m.BOT_AGENT_LIST.agents.length === 15,
  FAMILY_PATTERNS: (m) => m.FAMILY_PATTERNS.length > 0,
  SCANNER_PATH_PATTERNS: (m) => m.SCANNER_PATH_PATTERNS.some((p) => p.test('/.env')),
  botAgentListSchema: (m) => m.botAgentListSchema.parse(m.BOT_AGENT_LIST).agents.length === 15,
  botAgentSchema: (m) => m.botAgentSchema.parse(m.BOT_AGENT_LIST.agents[0]).key === 'control-browser',
  classifyAgent: (m) => m.classifyAgent('Mozilla/5.0; compatible; GPTBot/1.4', 'http') === 'gptbot',
  CORE_VERSION: (m) => typeof m.CORE_VERSION === 'string' && m.CORE_VERSION.length > 0,
  canonicalHash: (m) => m.canonicalHash({ b: 1, a: 2 }) === m.canonicalHash({ a: 2, b: 1 }),
  stableStringify: (m) => m.stableStringify({ b: 1, a: [2, 1] }) === '{"a":[2,1],"b":1}',
  evaluateBotPath: (m) => m.evaluateBotPath('User-agent: GPTBot\nDisallow: /', 'GPTBot', '/x').allowed === false,
}
