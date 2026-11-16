// Source: Susurration playground, src/telemetry/salt.ts at
// 6556e103a08e428a6b13870be3f63287d14a5357 (the hash in createDailySalter),
// unchanged. The visitor address is hashed with one random 32-byte salt per
// UTC day, so a hash can only be linked within that day. Creating, storing and
// deleting the salt is up to the consumer; this package has no storage.
import { createHmac } from 'node:crypto'

/** HMAC-SHA256 of the address with the day's salt, as 64 lowercase hex characters. */
export function hashWithDailySalt(salt: Uint8Array, ip: string): string {
  if (salt.length !== 32) throw new Error('the daily salt must be 32 bytes')
  return createHmac('sha256', salt).update(ip).digest('hex')
}
