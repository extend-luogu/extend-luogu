import { describe, expect, it } from 'vitest'
import { atCoderDifficultyMap, codeforcesRating, normalizeAtCoderDifficulty, parseCodeforcesPid } from './difficulty'

describe('original difficulty helpers', () => {
  it('parses Codeforces ids and validates ratings', () => {
    expect(parseCodeforcesPid('CF1234A')).toEqual({ contestId: 1234, index: 'A' })
    expect(codeforcesRating({ status: 'OK', result: { problems: [{ index: 'A', rating: 1600, token: 'x' }] } }, 'A')).toBe(1600)
  })
  it('keeps the low AtCoder conversion', () => expect(normalizeAtCoderDifficulty(0)).toBe(147))
  it('builds a bounded sanitized map', () => expect(atCoderDifficultyMap({ abc_a: { difficulty: 800 }, bad: { token: 'x' } })).toEqual({ abc_a: 800 }))
})
