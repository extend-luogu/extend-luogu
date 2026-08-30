import { describe, expect, expectTypeOf, it } from 'vitest'
import { defineFeature, normalizeSettingValue, setting } from '../src'

describe('number settings', () => {
  const definition = setting.number({
    title: 'Count', default: 4, min: 2, max: 10, step: 2, integer: true,
  })

  it('validates finite range, step, and integer constraints', () => {
    expect(normalizeSettingValue(definition, 4)).toBe(4)
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, 1, 3, 12, 4.5]) {
      expect(normalizeSettingValue(definition, value)).toBeUndefined()
    }
  })

  it('rejects invalid schema defaults and bounds', () => {
    expect(() => setting.number({ title: 'Bad', default: Number.NaN })).toThrow()
    expect(() => setting.number({ title: 'Bad', default: 1, min: 2 })).toThrow()
    expect(() => setting.number({ title: 'Bad', default: 1, step: 0 })).toThrow()
  })
})

describe('multiSelect settings', () => {
  const definition = setting.multiSelect({
    title: 'Groups',
    default: ['b', 'a', 'b'],
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ],
  })

  it('deduplicates and orders values by option declaration', () => {
    expect(definition.default).toEqual(['a', 'b'])
    expect(normalizeSettingValue(definition, ['c', 'a', 'c'])).toEqual(['a', 'c'])
    expect(normalizeSettingValue(definition, ['unknown'])).toBeUndefined()
    expect(normalizeSettingValue(definition, 'a')).toBeUndefined()
  })

  it('preserves inferred number and option-array value types', () => {
    const feature = defineFeature({
      id: 'settings.types', apiVersion: 1, title: 'Types', description: 'Types',
      category: 'test', defaultEnabled: false, matches: () => true, capabilities: [],
      settings: {
        count: setting.number({ title: 'Count', default: 2 }),
        groups: definition,
      },
      async mount(ctx) {
        expectTypeOf(await ctx.settings.get('count')).toEqualTypeOf<number>()
        expectTypeOf(await ctx.settings.get('groups')).toEqualTypeOf<readonly ('a' | 'b' | 'c')[]>()
      },
    })
    expect(feature.settings.groups.default).toEqual(['a', 'b'])
  })
})
