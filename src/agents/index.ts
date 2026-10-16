export { BOT_AGENT_LIST } from './list.js'
export { botAgentSchema, botAgentListSchema } from './schema.js'
export { classifyAgent, FAMILY_PATTERNS, SCANNER_PATH_PATTERNS } from './families.js'
export type { ClassifyOptions, FamilyPattern, VisitChannel } from './families.js'
export type { BotAgent, BotAgentList, BotCategory } from './types.js'

/** ISO date of the last change in content to BOT_AGENT_LIST or its families. */
export const AGENT_LIST_VERSION = '2026-10-16'
