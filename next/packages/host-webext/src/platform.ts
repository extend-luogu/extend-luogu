import type { JsonKeyValueStore } from '@exlg/browser'
import type { JsonValue } from '@exlg/runtime'

interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>
  set(values: Record<string, unknown>): Promise<void>
  remove(key: string): Promise<void>
}

interface ExtensionApi {
  readonly storage: { readonly local: StorageArea }
}

function extensionApi(): ExtensionApi {
  const globals = globalThis as typeof globalThis & {
    readonly browser?: ExtensionApi
    readonly chrome?: ExtensionApi
  }
  const api = globals.browser ?? globals.chrome
  if (!api) throw new Error('WebExtension storage API is unavailable')
  return api
}

export class WebExtensionStore implements JsonKeyValueStore {
  async get(key: string): Promise<unknown> {
    return (await extensionApi().storage.local.get(key))[key]
  }

  async set(key: string, value: JsonValue): Promise<void> {
    await extensionApi().storage.local.set({ [key]: value })
  }

  async delete(key: string): Promise<void> {
    await extensionApi().storage.local.remove(key)
  }
}

export const webExtensionClipboard = {
  async writeText(text: string): Promise<void> {
    await navigator.clipboard.writeText(text)
  },
}
