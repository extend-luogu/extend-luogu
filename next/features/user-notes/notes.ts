import type { JsonValue } from '@exlg/runtime'

export interface UserNotesData extends Record<string, JsonValue> {
  readonly version: 1
  readonly notes: Readonly<Record<string, { readonly text: string; readonly updatedAt: number }>>
}

export function sanitizeNote(text: string): string {
  return [...text].filter(character => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }).join('').trim().slice(0, 80)
}

export function sanitizeNotesData(value: unknown): UserNotesData {
  const empty: UserNotesData = { version: 1, notes: {} }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return empty
  const raw = value as Record<string, unknown>
  if (raw.version !== 1 || typeof raw.notes !== 'object' || raw.notes === null || Array.isArray(raw.notes)) return empty
  const notes: Record<string, { text: string; updatedAt: number }> = {}
  for (const [uid, entry] of Object.entries(raw.notes as Record<string, unknown>).slice(0, 5_000)) {
    if (!/^[1-9]\d*$/.test(uid) || typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue
    const item = entry as Record<string, unknown>
    const text = typeof item.text === 'string' ? sanitizeNote(item.text) : ''
    if (text && typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt)) notes[uid] = { text, updatedAt: item.updatedAt }
  }
  return { version: 1, notes }
}
