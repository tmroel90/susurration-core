// Source: Susurration playground, src/telemetry/salt.ts at
// 6556e103a08e428a6b13870be3f63287d14a5357: the visitor hash is
// createHmac('sha256', salt).update(ip).digest('hex'), with one random 32-byte
// salt per UTC day. Core only holds the hash; where the salt lives is up to
// the consumer.
import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { hashWithDailySalt } from '../src/verify/index.js'

const SALT = Buffer.from('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', 'hex')

describe('hashWithDailySalt', () => {
  it('is HMAC-SHA256 over the address with the salt, as lowercase hex', () => {
    const expected = createHmac('sha256', SALT).update('203.0.113.7').digest('hex')
    expect(hashWithDailySalt(SALT, '203.0.113.7')).toBe(expected)
    expect(hashWithDailySalt(SALT, '203.0.113.7')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('matches a fixed vector', () => {
    expect(hashWithDailySalt(SALT, '203.0.113.7')).toBe(
      createHmac('sha256', Buffer.from(SALT)).update(Buffer.from('203.0.113.7', 'utf8')).digest('hex'),
    )
  })

  it('accepts a plain Uint8Array salt', () => {
    expect(hashWithDailySalt(new Uint8Array(SALT), '2001:db8::1')).toBe(hashWithDailySalt(SALT, '2001:db8::1'))
  })

  it('differs per address and per salt', () => {
    const other = Buffer.alloc(32, 7)
    expect(hashWithDailySalt(SALT, '203.0.113.7')).not.toBe(hashWithDailySalt(SALT, '203.0.113.8'))
    expect(hashWithDailySalt(SALT, '203.0.113.7')).not.toBe(hashWithDailySalt(other, '203.0.113.7'))
  })

  it('refuses a salt shorter than 32 bytes', () => {
    expect(() => hashWithDailySalt(Buffer.alloc(16), '203.0.113.7')).toThrow(/32 bytes/)
  })
})
