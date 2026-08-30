import {
  createFetchNetworkTransport,
  type JsonKeyValueStore,
  type RestrictedNetworkTransport,
} from '@exlg/browser'
import type { JsonValue } from '@exlg/runtime'
import type { NetworkBrokerCancelMessage, NetworkBrokerRequestMessage } from './network-protocol'
import { isNetworkBrokerResponse } from './network-protocol'

interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>
  set(values: Record<string, unknown>): Promise<void>
  remove(key: string): Promise<void>
}

interface ExtensionApi {
  readonly storage: { readonly local: StorageArea }
  readonly runtime: { sendMessage(message: NetworkBrokerRequestMessage | NetworkBrokerCancelMessage): Promise<unknown> }
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

export function createWebExtensionNetworkTransport(
  target: Window & typeof globalThis,
): RestrictedNetworkTransport {
  const native = createFetchNetworkTransport({ luoguOrigin: target.location.origin, fetch: target.fetch.bind(target) })
  return {
    async request(request) {
      if (request.target === 'luogu') return await native.request(request)
      const requestId = target.crypto.randomUUID()
      const abort = (): void => {
        void extensionApi().runtime.sendMessage({ type: 'exlg-network-cancel-v1', requestId })
      }
      if (request.signal.aborted) abort()
      else request.signal.addEventListener('abort', abort, { once: true })
      try {
        const response = await extensionApi().runtime.sendMessage({
          type: 'exlg-network-request-v1',
          requestId,
          request: {
            target: request.target,
            path: request.path,
            method: request.method,
            query: request.query,
            headers: request.headers,
            ...(request.body === undefined ? {} : { body: request.body }),
            timeoutMs: request.timeoutMs,
          },
        })
        if (!isNetworkBrokerResponse(response) || response.requestId !== requestId || !response.ok) {
          throw new Error('Extension network broker failed')
        }
        return { status: response.status, body: response.body, finalUrl: response.finalUrl }
      }
      finally { request.signal.removeEventListener('abort', abort) }
    },
  }
}
