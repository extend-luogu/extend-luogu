import { describe, expect, it } from 'vitest'
import { navigationIntents, normalizeProblemId } from './parser'

describe('quick navigation parser', () => {
  it.each([['P1000', 'P1000'], ['1234A', 'CF1234A'], ['CF1888A', 'CF1888A'], ['ABC300A', 'AT_ABC300_A'], ['ABC300_A', 'AT_ABC300_A'], ['UVA100', 'UVA100'], ['SP1', 'SP1']])('normalizes %s', (source, expected) => expect(normalizeProblemId(source)).toBe(expected))
  it('keeps the historical ARC offset correction', () => expect(normalizeProblemId('ARC058C')).toBe('AT_ARC058_A'))
  it('does not treat ordinary short numbers as problem ids', () => expect(normalizeProblemId('123')).toBeNull())
  it('parses typed destinations', () => expect(navigationIntents('比赛 42')[0]?.path).toBe('/contest/42'))
})
