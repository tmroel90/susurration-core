export { BOT_AGENT_LIST } from './list.js'
export { botAgentSchema, botAgentListSchema } from './schema.js'
export { classifyAgent, FAMILY_PATTERNS, orderedFamilyPatterns, SCANNER_PATH_PATTERNS } from './families.js'
export type { ClassifyOptions, FamilyPattern, VisitChannel } from './families.js'
export { classifyReferrer, REFERRER_CLASS_PATTERNS } from './referrers.js'
export type { ReferrerClassPattern, ReferrerOptions } from './referrers.js'
export type { BotAgent, BotAgentList, BotCategory } from './types.js'

/** ISO date of the last change in content to BOT_AGENT_LIST or its families. */
export const AGENT_LIST_VERSION = '2026-11-16'
