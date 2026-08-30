const FALLBACK_WEBSOCKET_URL = 'wss://ws.luogu.com.cn/ws'

export interface LuoguFetchResponse {
  readonly ok: boolean
  json(): Promise<unknown>
}

export type LuoguFetch = (
  input: string,
  init: {
    readonly method: 'GET'
    readonly credentials: 'include'
    readonly signal?: AbortSignal
  },
) => Promise<LuoguFetchResponse>

interface ResolveWebSocketOptions {
  readonly origin: string
  readonly fetch: LuoguFetch
  readonly signal?: AbortSignal
  readonly warn?: (message: string) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAllowedLuoguHostname(hostname: string): boolean {
  return hostname === 'luogu.com.cn'
    || hostname.endsWith('.luogu.com.cn')
    || hostname === 'luogu.com'
    || hostname.endsWith('.luogu.com')
}

export function validateLuoguWebSocketUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'wss:' || !isAllowedLuoguHostname(url.hostname)) return null
    return url.href
  }
  catch {
    return null
  }
}

export async function resolveLuoguWebSocketUrl(
  options: ResolveWebSocketOptions,
): Promise<string> {
  try {
    const origin = new URL(options.origin)
    if (!isAllowedLuoguHostname(origin.hostname)) throw new Error('Unexpected page origin')
    const response = await options.fetch(new URL('/_lfe/config', origin).href, {
      method: 'GET',
      credentials: 'include',
      ...(options.signal ? { signal: options.signal } : {}),
    })
    if (!response.ok) throw new Error('Configuration request failed')
    const body = await response.json()
    const server = isRecord(body) && isRecord(body.ws) ? body.ws.server : undefined
    const validated = validateLuoguWebSocketUrl(server)
    if (!validated) throw new Error('Configuration response is invalid')
    return validated
  }
  catch {
    if (options.signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError')
    options.warn?.('WebSocket 配置不可用，使用受限的洛谷回退地址')
    return FALLBACK_WEBSOCKET_URL
  }
}
