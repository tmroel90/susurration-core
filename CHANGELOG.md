# Changelog

This project follows semantic versioning. Any change in content to the agent list or to the classification rules is at least a minor version, never a patch, because results before and after such a change are not directly comparable.

## 0.1.0

First release.

- `agents`: `BOT_AGENT_LIST` with 15 agents, equal to the source list in Lens as last changed on 2026-10-05, plus an optional `family` per agent. `AGENT_LIST_VERSION` is 2026-10-16, the date the `family` field was added. `classifyAgent` with the generic families and scanner path signatures from the Susurration playground, and `options.patterns` for a consumer's own families. The Zod schemas `botAgentSchema` and `botAgentListSchema`.
- `robots`: `evaluateBotPath` (RFC 9309), without network code.
- `verify`: `stableStringify`, `canonicalHash` (sha256 hex of `stableStringify`) and `CORE_VERSION`.
