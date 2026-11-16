// Test vectors taken over literally from Susurration playground,
// test/telemetry/telemetry.test.ts at 6556e103a08e428a6b13870be3f63287d14a5357
// (the "referrer classification" block). The source's own classes (own and
// one named partner site) are consumer patterns here, exactly as the source
// passes them, so every vector comes out the same.
import { describe, expect, it } from 'vitest'
import { classifyReferrer, REFERRER_CLASS_PATTERNS, type ReferrerOptions } from '../src/agents/index.js'

const SOURCE: ReferrerOptions = {
  patterns: [
    { class: 'own', pattern: /(^|\.)susurration\.ai$/i },
    { class: 'hoeijmakers', pattern: /(^|\.)hoeijmakers\.(net|ghost\.io)$/i },
  ],
}

describe('source vectors (with the source patterns)', () => {
  it.each([
    ['https://susurration.ai/whispers', 'own'],
    ['https://www.hoeijmakers.net/artikel', 'hoeijmakers'],
    ['https://hoeijmakers.ghost.io/x', 'hoeijmakers'],
    ['https://glama.ai/mcp/connectors/x', 'catalog'],
    ['https://github.com/punkpeye/awesome-mcp-servers', 'catalog'],
    ['https://www.google.nl/search?q=boids', 'search-engine'],
    ['https://chatgpt.com/c/abc', 'ai-assistant'],
    ['https://claude.ai/chat/x', 'ai-assistant'],
    ['https://example.org/page', 'other'],
    ['not a url', 'other'],
  ])('classifies %s as %s', (referer, expected) => {
    expect(classifyReferrer(referer, SOURCE)).toBe(expected)
  })

  it('classifies a missing, empty or blank header as none', () => {
    expect(classifyReferrer(undefined, SOURCE)).toBe('none')
    expect(classifyReferrer('', SOURCE)).toBe('none')
    expect(classifyReferrer('   ', SOURCE)).toBe('none')
  })
})

describe('generic classes', () => {
  it('are catalog, search-engine and ai-assistant, in that order', () => {
    expect(REFERRER_CLASS_PATTERNS.map((p) => p.class)).toEqual(['catalog', 'search-engine', 'ai-assistant'])
  })

  it('give other for a site-specific host without consumer patterns', () => {
    expect(classifyReferrer('https://susurration.ai/whispers')).toBe('other')
    expect(classifyReferrer('https://registry.modelcontextprotocol.io/v0.1/servers')).toBe('catalog')
    expect(classifyReferrer('https://smithery.ai/server/x')).toBe('catalog')
    expect(classifyReferrer('https://www.perplexity.ai/search/x')).toBe('ai-assistant')
  })

  it('evaluate consumer patterns first', () => {
    expect(classifyReferrer('https://github.com/x', { patterns: [{ class: 'own', pattern: /^github\.com$/i }] })).toBe('own')
  })

  it('return only a class name, never part of the header', () => {
    const header = 'https://glama.ai/mcp/servers?q=some-private-path'
    const cls = classifyReferrer(header, SOURCE)
    expect(cls).toBe('catalog')
    expect(['own', 'hoeijmakers', 'catalog', 'search-engine', 'ai-assistant', 'none', 'other']).toContain(cls)
  })
})
