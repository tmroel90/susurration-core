// Source: hiveminds-lens-snapshot app/services/access_audit/types.ts at
// 29e86804aca9e02d3a3584a507419a1818a7efb7 (BotCategory, BotAgent,
// BotAgentList), plus the optional `family` and readonly arrays for the
// constant list.

export type BotCategory = 'training' | 'search' | 'userfetch' | 'control'

/** One agent from the canonical list. */
export type BotAgent = {
  key: string
  label: string
  category: BotCategory
  robotsToken: string | null
  userAgent: string | null
  declarativeOnly: boolean
  source: string
  verifiedAt: string
  note: string | null
  /** The generic family from classifyAgent that belongs to this agent one to one, if any. */
  family?: string
}

export type BotAgentList = {
  verifiedAt: string
  agents: readonly BotAgent[]
}
