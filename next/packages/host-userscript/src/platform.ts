import type { JsonKeyValueStore } from '@exlg/browser'
import type { JsonValue } from '@exlg/runtime'

export class UserscriptStore implements JsonKeyValueStore {
  async get(key: string): Promise<unknown> {
    return GM_getValue<unknown>(key)
  }

  async set(key: string, value: JsonValue): Promise<void> {
    GM_setValue(key, value)
  }

  async delete(key: string): Promise<void> {
    GM_deleteValue(key)
  }
}

export const userscriptClipboard = {
  async writeText(text: string): Promise<void> {
    GM_setClipboard(text, 'text')
  },
}
