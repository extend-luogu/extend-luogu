import {
  networkTargetOrigin,
  type JsonKeyValueStore,
  type RestrictedNetworkTransport,
} from '@exlg/browser'
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

export function createUserscriptNetworkTransport(
  target: Window & typeof globalThis,
): RestrictedNetworkTransport {
  return {
    async request(request) {
      const url = new URL(request.path, networkTargetOrigin(request.target, target.location.origin))
      for (const [name, value] of Object.entries(request.query)) url.searchParams.set(name, value)
      if (request.target === 'luogu') {
        const response = await target.fetch(url, {
          method: request.method,
          headers: request.headers,
          ...(request.body === undefined ? {} : { body: request.body }),
          credentials: 'include',
          redirect: 'follow',
          signal: request.signal,
        })
        return { status: response.status, body: await response.text(), finalUrl: response.url }
      }
      return await new Promise((resolve, reject) => {
        let settled = false
        const finish = (callback: () => void): void => {
          if (settled) return
          settled = true
          request.signal.removeEventListener('abort', abort)
          callback()
        }
        const handle = GM_xmlhttpRequest({
          url: url.href,
          method: request.method,
          headers: request.headers,
          ...(request.body === undefined ? {} : { data: request.body }),
          timeout: request.timeoutMs,
          anonymous: true,
          responseType: 'text',
          onload: response => finish(() => resolve({
              status: response.status,
              body: response.responseText,
              finalUrl: response.finalUrl ?? url.href,
            })),
          onerror: () => finish(() => reject(new Error('GM network request failed'))),
          onabort: () => finish(() => reject(new Error('GM network request aborted'))),
          ontimeout: () => finish(() => reject(new Error('GM network request timed out'))),
        })
        function abort(): void { handle.abort() }
        if (request.signal.aborted) abort()
        else request.signal.addEventListener('abort', abort, { once: true })
      })
    },
  }
}
