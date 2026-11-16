# Changelog

This project follows semantic versioning. Any change in content to the agent list or to the classification rules is at least a minor version, never a patch, because results before and after such a change are not directly comparable.

## 0.2.0

Minor version: the classification rules changed in content, so results from 0.1.0 and 0.2.0 are not directly comparable.

- `agents`: the families and scanner path signatures follow the Susurration playground as of 2026-11-16. New families `skitter` (a named agent, before `monitor`) and `declared-agent` (a UA that calls itself an AI, LLM or autonomous agent, after `monitor`). 24 more scanner path signatures for config, dump and console probes (seen 19 to 26 October 2026). `AGENT_LIST_VERSION` is 2026-11-16.
- `agents`: a consumer pattern can carry `before: '<family>'` to be matched right in front of that generic family instead of first. Without `before`, behaviour is as in 0.1.0. New `orderedFamilyPatterns(options?)` returns the order `classifyAgent` uses.
- `agents`: new `classifyReferrer(referer, options?)` and `REFERRER_CLASS_PATTERNS` (`catalog`, `search-engine`, `ai-assistant`, plus `none` and `other`), with the consumer's own classes in `options.patterns`.
- `verify`: new `hashWithDailySalt(salt, ip)`, HMAC-SHA256 hex with a 32-byte salt.

## 0.1.0

First release.

- `agents`: `BOT_AGENT_LIST` with 15 agents, equal to the source list in Lens as last changed on 2026-10-05, plus an optional `family` per agent. `AGENT_LIST_VERSION` is 2026-10-16, the date the `family` field was added. `classifyAgent` with the generic families and scanner path signatures from the Susurration playground, and `options.patterns` for a consumer's own families. The Zod schemas `botAgentSchema` and `botAgentListSchema`.
- `robots`: `evaluateBotPath` (RFC 9309), without network code.
- `verify`: `stableStringify`, `canonicalHash` (sha256 hex of `stableStringify`) and `CORE_VERSION`.
