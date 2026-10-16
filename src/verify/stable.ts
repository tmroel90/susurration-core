// Source: Susurration playground, src/api/serialize.ts lines 14-20 at
// d5f58c6f0ef51ef21b27ac1568c9c8ac600f1ca9 (stableStringify), unchanged.
import { createHash } from 'node:crypto'

// Canonical JSON with keys sorted at every level. MySQL JSON columns reorder
// object keys on storage, so a stored record and a fresh replay can hold
// identical values in a different key order; JSON.stringify would then differ
// byte-for-byte. Comparing stableStringify makes verification depend on values,
// not on key order.
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`).join(',')}}`
}

/** The sha256 hex digest of stableStringify(value). */
export function canonicalHash(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}
