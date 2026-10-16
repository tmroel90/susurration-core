// Source: hiveminds-lens-snapshot app/services/access_audit/agents.ts lines
// 15-42 at 29e86804aca9e02d3a3584a507419a1818a7efb7, plus the optional
// `family` field.
import { z } from 'zod'

export const botAgentSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    category: z.enum(['training', 'search', 'userfetch', 'control']),
    robotsToken: z.string().min(1).nullable(),
    userAgent: z.string().min(1).nullable(),
    declarativeOnly: z.boolean(),
    source: z.string().url(),
    verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: z.string().nullable(),
    family: z.string().min(1).optional(),
  })
  .refine((agent) => agent.declarativeOnly || agent.userAgent !== null, {
    message: 'een agent zonder UA-string moet declarativeOnly zijn',
  })

export const botAgentListSchema = z.object({
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  agents: z.array(botAgentSchema).superRefine((agents, ctx) => {
    const keys = agents.map((a) => a.key)
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dubbele agent-keys in bot_agents.json',
      })
    }
  }),
})
