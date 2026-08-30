import {
  allowedNetworkPath,
  maximumNetworkResponseBytes,
  networkTargetOrigin,
} from '@exlg/browser'
import type { ExternalNetworkTarget, NetworkBrokerMessage, NetworkBrokerResponse } from './network-protocol'

const externalTargets = new Set<ExternalNetworkTarget>([
  'codeforces', 'atcoder-problems', 'cph-localhost', 'cph-loopback',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validRequest(value: unknown): value is Extract<NetworkBrokerMessage, { type: 'exlg-network-request-v1' }> {
  if (!isRecord(value) || value.type !== 'exlg-network-request-v1' || typeof value.requestId !== 'string') return false
  if (!isRecord(value.request)) return false
  const request = value.request
  if (typeof request.target !== 'string' || !externalTargets.has(request.target as ExternalNetworkTarget)) return false
  const target = request.target as ExternalNetworkTarget
  if (typeof request.path !== 'string' || !allowedNetworkPath(target, request.path)) return false
  if (!['GET', 'POST'].includes(String(request.method))) return false
  if ((target === 'codeforces' || target === 'atcoder-problems') && request.method !== 'GET') return false
  if ((target === 'cph-localhost' || target === 'cph-loopback') && request.method !== 'POST') return false
  if (request.method === 'GET' && request.body !== undefined) return false
  if (!isRecord(request.query) || !Object.values(request.query).every(item => typeof item === 'string')) return false
  if (!isRecord(request.headers) || !Object.entries(request.headers).every(([name, item]) =>
    ['accept', 'content-type'].includes(name.toLowerCase()) && typeof item === 'string' && !/[\r\n]/.test(item))) return false
  if (request.body !== undefined && typeof request.body !== 'string') return false
  return typeof request.timeoutMs === 'number' && Number.isFinite(request.timeoutMs)
    && request.timeoutMs >= 100 && request.timeoutMs <= 60_000
}

function errorResponse(
  requestId: string,
  error: Extract<NetworkBrokerResponse, { ok: false }>['error'],
): NetworkBrokerResponse {
  return { type: 'exlg-network-response-v1', requestId, ok: false, error }
}

export function createNetworkBroker(fetcher: typeof fetch = fetch) {
  const active = new Map<string, AbortController>()
  return {
    cancel(requestId: string): void {
      active.get(requestId)?.abort()
      active.delete(requestId)
    },
    async request(message: unknown): Promise<NetworkBrokerResponse> {
      if (!validRequest(message)) {
        const requestId = isRecord(message) && typeof message.requestId === 'string' ? message.requestId : ''
        return errorResponse(requestId, 'invalid-request')
      }
      const { requestId, request } = message
      const controller = new AbortController()
      active.set(requestId, controller)
      let timeout = false
      const timer = setTimeout(() => {
        timeout = true
        controller.abort()
      }, request.timeoutMs)
      try {
        const origin = networkTargetOrigin(request.target, 'https://www.luogu.com.cn')
        const url = new URL(request.path, origin)
        for (const [name, value] of Object.entries(request.query)) url.searchParams.set(name, value)
        const response = await fetcher(url, {
          method: request.method,
          headers: request.headers,
          ...(request.body === undefined ? {} : { body: request.body }),
          credentials: 'omit',
          redirect: 'follow',
          signal: controller.signal,
          referrerPolicy: 'no-referrer',
        })
        if (new URL(response.url).origin !== origin) return errorResponse(requestId, 'redirect')
        const body = await response.text()
        if (new TextEncoder().encode(body).byteLength > maximumNetworkResponseBytes(request.target)) {
          return errorResponse(requestId, 'response-too-large')
        }
        return {
          type: 'exlg-network-response-v1', requestId, ok: true,
          status: response.status, body, finalUrl: response.url,
        }
      }
      catch {
        return errorResponse(requestId, timeout ? 'timeout' : controller.signal.aborted ? 'aborted' : 'transport')
      }
      finally {
        clearTimeout(timer)
        active.delete(requestId)
      }
    },
  }
}
