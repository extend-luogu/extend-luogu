import type {
  NetworkRequest,
  NetworkResponse,
  NetworkService,
  NetworkTarget,
} from '@exlg/runtime'

export type NetworkErrorCode =
  | 'invalid-request'
  | 'timeout'
  | 'aborted'
  | 'transport'
  | 'redirect'
  | 'response-too-large'
  | 'http'
  | 'invalid-json'

export class NetworkRequestError extends Error {
  readonly code: NetworkErrorCode
  readonly target: NetworkTarget
  readonly status?: number

  constructor(code: NetworkErrorCode, target: NetworkTarget, message: string, status?: number) {
    super(message)
    this.name = 'NetworkRequestError'
    this.code = code
    this.target = target
    if (status !== undefined) this.status = status
  }
}

export interface RestrictedNetworkTransportRequest {
  readonly target: NetworkTarget
  readonly path: string
  readonly method: 'GET' | 'POST'
  readonly query: Readonly<Record<string, string>>
  readonly headers: Readonly<Record<string, string>>
  readonly body?: string
  readonly credentials: 'include' | 'omit'
  readonly timeoutMs: number
  readonly signal: AbortSignal
}

export interface RestrictedNetworkTransportResponse {
  readonly status: number
  readonly body: string
  readonly finalUrl: string
}

export interface RestrictedNetworkTransport {
  request(request: RestrictedNetworkTransportRequest): Promise<RestrictedNetworkTransportResponse>
}

const targetOrigins: Readonly<Record<Exclude<NetworkTarget, 'luogu'>, string>> = {
  codeforces: 'https://codeforces.com',
  'atcoder-problems': 'https://kenkoooo.com',
  'cph-localhost': 'http://localhost:27121',
  'cph-loopback': 'http://127.0.0.1:27121',
}

const responseLimits: Readonly<Record<NetworkTarget, number>> = {
  luogu: 2 * 1024 * 1024,
  codeforces: 2 * 1024 * 1024,
  'atcoder-problems': 8 * 1024 * 1024,
  'cph-localhost': 1024 * 1024,
  'cph-loopback': 1024 * 1024,
}

export function maximumNetworkResponseBytes(target: NetworkTarget): number {
  return responseLimits[target]
}

export function networkTargetOrigin(target: NetworkTarget, luoguOrigin: string): string {
  return target === 'luogu' ? new URL(luoguOrigin).origin : targetOrigins[target]
}

export function allowedNetworkPath(target: NetworkTarget, path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[?#]/.test(path)) return false
  let decoded: string
  try { decoded = decodeURIComponent(path) }
  catch { return false }
  if (decoded.split('/').includes('..')) return false
  if (target === 'luogu') return true
  if (target === 'codeforces') return path === '/api/contest.standings'
  if (target === 'atcoder-problems') return path === '/atcoder/resources/problem-models.json'
  return path === '/'
}

function normalizeHeaders(
  target: NetworkTarget,
  headers: Readonly<Record<string, string>> | undefined,
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const [rawName, value] of Object.entries(headers ?? {})) {
    const name = rawName.toLowerCase()
    const allowed = ['accept', 'content-type'].includes(name)
      || (target === 'luogu' && ['x-luogu-type', 'x-lentille-request'].includes(name))
    if (!allowed || /[\r\n]/.test(value)) {
      throw new NetworkRequestError('invalid-request', target, `Header ${rawName} is not allowed`)
    }
    result[name] = value
  }
  return result
}

function normalizeQuery(
  target: NetworkTarget,
  query: NetworkRequest['query'],
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const [name, value] of Object.entries(query ?? {})) {
    if (!/^[A-Za-z0-9_.-]{1,64}$/.test(name)) {
      throw new NetworkRequestError('invalid-request', target, 'Query parameter name is invalid')
    }
    result[name] = String(value)
  }
  return result
}

function combinedSignal(
  target: NetworkTarget,
  source: AbortSignal | undefined,
  timeoutMs: number,
): { readonly signal: AbortSignal; readonly cleanup: () => void; readonly timedOut: () => boolean } {
  const controller = new AbortController()
  let timeout = false
  const abort = (): void => controller.abort(source?.reason)
  if (source?.aborted) abort()
  else source?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => {
    timeout = true
    controller.abort(new NetworkRequestError('timeout', target, 'Network request timed out'))
  }, timeoutMs)
  return {
    signal: controller.signal,
    timedOut: () => timeout,
    cleanup: () => {
      clearTimeout(timer)
      source?.removeEventListener('abort', abort)
    },
  }
}

export function createRestrictedNetworkService(options: {
  readonly luoguOrigin: string
  readonly transport: RestrictedNetworkTransport
  readonly defaultTimeoutMs?: number
}): NetworkService {
  const luoguOrigin = new URL(options.luoguOrigin).origin
  return {
    async request<T>(target: NetworkTarget, request: NetworkRequest): Promise<NetworkResponse<T>> {
      if (!allowedNetworkPath(target, request.path)) {
        throw new NetworkRequestError('invalid-request', target, 'Network path is not allowed')
      }
      const method = request.method ?? 'GET'
      if (target !== 'luogu' && target !== 'cph-localhost' && target !== 'cph-loopback' && method !== 'GET') {
        throw new NetworkRequestError('invalid-request', target, 'Network method is not allowed')
      }
      if ((target === 'cph-localhost' || target === 'cph-loopback') && method !== 'POST') {
        throw new NetworkRequestError('invalid-request', target, 'CPH only accepts POST')
      }
      if (method === 'GET' && request.body !== undefined) {
        throw new NetworkRequestError('invalid-request', target, 'GET request cannot contain a body')
      }
      const timeoutMs = request.timeoutMs ?? options.defaultTimeoutMs ?? 10_000
      if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 60_000) {
        throw new NetworkRequestError('invalid-request', target, 'Network timeout is invalid')
      }
      const abort = combinedSignal(target, request.signal, timeoutMs)
      try {
        const response = await options.transport.request({
          target,
          path: request.path,
          method,
          query: normalizeQuery(target, request.query),
          headers: normalizeHeaders(target, request.headers),
          ...(request.body === undefined ? {} : { body: request.body }),
          credentials: target === 'luogu' ? 'include' : 'omit',
          timeoutMs,
          signal: abort.signal,
        })
        const expectedOrigin = networkTargetOrigin(target, luoguOrigin)
        let finalOrigin: string
        try { finalOrigin = new URL(response.finalUrl).origin }
        catch { throw new NetworkRequestError('redirect', target, 'Network response URL is invalid') }
        if (finalOrigin !== expectedOrigin) {
          throw new NetworkRequestError('redirect', target, 'Network redirect left the allowed origin')
        }
        if (new TextEncoder().encode(response.body).byteLength > responseLimits[target]) {
          throw new NetworkRequestError('response-too-large', target, 'Network response exceeded its size limit')
        }
        if (response.status < 200 || response.status >= 300) {
          throw new NetworkRequestError('http', target, `Network request failed with status ${response.status}`, response.status)
        }
        let data: unknown = response.body
        if (request.responseType === 'json') {
          try { data = JSON.parse(response.body) }
          catch { throw new NetworkRequestError('invalid-json', target, 'Network response was not valid JSON') }
        }
        return { status: response.status, ok: true, data: data as T }
      }
      catch (error) {
        if (error instanceof NetworkRequestError) throw error
        if (abort.signal.aborted) {
          throw new NetworkRequestError(abort.timedOut() ? 'timeout' : 'aborted', target,
            abort.timedOut() ? 'Network request timed out' : 'Network request was aborted')
        }
        throw new NetworkRequestError('transport', target, 'Network transport failed')
      }
      finally { abort.cleanup() }
    },
  }
}

export function createFetchNetworkTransport(options: {
  readonly luoguOrigin: string
  readonly fetch: typeof fetch
}): RestrictedNetworkTransport {
  return {
    async request(request) {
      const url = new URL(request.path, networkTargetOrigin(request.target, options.luoguOrigin))
      for (const [name, value] of Object.entries(request.query)) url.searchParams.set(name, value)
      const response = await options.fetch(url, {
        method: request.method,
        headers: request.headers,
        ...(request.body === undefined ? {} : { body: request.body }),
        credentials: request.credentials,
        redirect: 'follow',
        signal: request.signal,
      })
      return { status: response.status, body: await response.text(), finalUrl: response.url }
    },
  }
}
