import { describe, expect, it } from 'vitest'
import { alreadyPublished } from '../scripts/published-check.mjs'

describe('alreadyPublished', () => {
  it('is true when npm view returns exactly this version', () => {
    expect(alreadyPublished('0.1.0', () => '0.1.0\n')).toBe(true)
  })

  it('is false when the version does not exist yet (empty output)', () => {
    expect(alreadyPublished('0.1.1', () => '')).toBe(false)
  })

  it('is false when the package does not exist (npm view fails)', () => {
    expect(
      alreadyPublished('0.1.0', () => {
        throw new Error('npm error code E404')
      }),
    ).toBe(false)
  })
})
