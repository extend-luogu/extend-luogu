import { describe, expect, it } from 'vitest'
import { sanitizeNote, sanitizeNotesData } from './notes'

describe('user notes data', () => {
  it('removes controls and limits text', () => expect(sanitizeNote(`  a\u0000${'b'.repeat(100)} `)).toHaveLength(80))
  it('accepts only positive uid entries without extra fields', () => expect(sanitizeNotesData({ version: 1, notes: { '12': { text: '同学', updatedAt: 1, token: 'x' }, '0': { text: 'x', updatedAt: 1 } }, cookie: 'x' })).toEqual({ version: 1, notes: { '12': { text: '同学', updatedAt: 1 } } }))
})
