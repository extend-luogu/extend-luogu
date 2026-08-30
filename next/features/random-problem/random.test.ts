import { describe, expect, it } from 'vitest'
import { chooseFilter, excludeKnownAccepted, parseProblemList, randomIndex } from './random'

describe('random problem helpers', () => {
  it('validates legacy and current content-only lists', () => {
    expect(parseProblemList({ code: 200, currentData: { problems: { count: 2, perPage: 50, result: [{ pid: 'P1' }, { token: 'secret' }] } } })).toEqual({ count: 2, perPage: 50, pids: ['P1'] })
    expect(parseProblemList({ status: 200, data: { problems: { count: 1, perPage: 25, result: [{ pid: 'CF1A' }] } } })).toEqual({ count: 1, perPage: 25, pids: ['CF1A'] })
  })
  it('rejects malformed or failed responses', () => {
    expect(parseProblemList({ status: 500, data: { problems: { count: 1, perPage: 50, result: [] } } })).toBeNull()
    expect(parseProblemList({ currentData: { problems: { count: -1, perPage: 50, result: [] } } })).toBeNull()
  })
  it('bounds injected randomness', () => expect(randomIndex(3, () => 0.999)).toBe(2))
  it('serializes one supported source and difficulty per request', () => {
    const values = [0.8, 0.2]
    expect(chooseFilter(['1', '4'], ['P', 'CF'], () => values.shift() ?? 0)).toEqual({ difficulty: 4, type: 'P' })
    expect(chooseFilter(['0'], [], () => 0)).toEqual({ type: 'P' })
  })
  it('excludes only known accepted PIDs without mutating input', () => {
    const pids = ['P1', 'P2'] as const
    expect(excludeKnownAccepted(pids, new Set(['P1']))).toEqual(['P2'])
    expect(excludeKnownAccepted(pids, null)).toEqual(['P1', 'P2'])
    expect(pids).toEqual(['P1', 'P2'])
  })
})
