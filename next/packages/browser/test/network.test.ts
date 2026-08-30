import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RestrictedNetworkTransport } from '../src'
import {
  createRestrictedNetworkService,
  networkTargetOrigin,
  NetworkRequestError,
} from '../src'

function transportWith(response: { status?: number; body?: string; finalUrl?: string } = {}): RestrictedNetworkTransport {
  return {
    async request(request) {
      return {
        status: response.status ?? 200,
        body: response.body ?? '{"ok":true}',
        finalUrl: response.finalUrl ?? `${networkTargetOrigin(request.target, 'https://www.luogu.com.cn')}${request.path}`,
      }
    },
  }
}

afterEach(() => { vi.useRealTimers() })

describe('restricted NetworkService', () => {
  it('maps targets to fixed origins and serializes safe query values', async () => {
    const request = vi.fn(transportWith().request)
    const network = createRestrictedNetworkService({
      luoguOrigin: 'https://www.luogu.com.cn', transport: { request },
    })
    await expect(network.request<{ ok: boolean }>('codeforces', {
      path: '/api/contest.standings', responseType: 'json', query: { contestId: 1, from: 1 },
    })).resolves.toMatchObject({ status: 200, data: { ok: true } })
    expect(networkTargetOrigin('codeforces', 'https://unused.test')).toBe('https://codeforces.com')
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      target: 'codeforces', path: '/api/contest.standings',
      query: { contestId: '1', from: '1' }, credentials: 'omit',
    })
  })

  it('rejects arbitrary URLs, dangerous paths, methods, headers, and CPH cookies', async () => {
    const network = createRestrictedNetworkService({
      luoguOrigin: 'https://www.luogu.com.cn', transport: transportWith(),
    })
    const cases = [
      network.request('luogu', { path: 'https://evil.test/', responseType: 'text' }),
      network.request('luogu', { path: '/../secret', responseType: 'text' }),
      network.request('codeforces', { path: '/api/contest.standings', method: 'POST', responseType: 'text' }),
      network.request('cph-localhost', { path: '/', method: 'POST', responseType: 'text', headers: { Cookie: 'x' } }),
    ]
    for (const result of cases) await expect(result).rejects.toBeInstanceOf(NetworkRequestError)
  })

  it('allows only Luogu content negotiation headers', async () => {
    const request = vi.fn(transportWith().request)
    const network = createRestrictedNetworkService({ luoguOrigin: 'https://www.luogu.com.cn', transport: { request } })
    await network.request('luogu', { path: '/problem/P1000', headers: { 'x-lentille-request': 'content-only' }, responseType: 'json' })
    expect(request.mock.calls[0]?.[0].headers).toEqual({ 'x-lentille-request': 'content-only' })
    await expect(network.request('codeforces', { path: '/api/contest.standings', headers: { 'x-luogu-type': 'content-only' }, responseType: 'json' })).rejects.toMatchObject({ code: 'invalid-request' })
  })

  it('normalizes HTTP, JSON, redirect, and response-size errors without response bodies', async () => {
    const cases = [
      { response: { status: 503 }, code: 'http', type: 'text' as const },
      { response: { body: 'invalid' }, code: 'invalid-json', type: 'json' as const },
      { response: { finalUrl: 'https://evil.test/data' }, code: 'redirect', type: 'text' as const },
      { response: { body: 'x'.repeat(2 * 1024 * 1024 + 1) }, code: 'response-too-large', type: 'text' as const },
    ]
    for (const item of cases) {
      const network = createRestrictedNetworkService({
        luoguOrigin: 'https://www.luogu.com.cn', transport: transportWith(item.response),
      })
      const result = network.request('luogu', { path: '/api/test', responseType: item.type })
      await expect(result).rejects.toMatchObject({ code: item.code })
      await expect(result).rejects.not.toThrow(/invalid|x{20}/)
    }
  })

  it('supports caller abort and bounded timeout', async () => {
    vi.useFakeTimers()
    const transport: RestrictedNetworkTransport = {
      request: request => new Promise((_resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      }),
    }
    const network = createRestrictedNetworkService({ luoguOrigin: 'https://www.luogu.com.cn', transport })
    const controller = new AbortController()
    const aborted = network.request('luogu', { path: '/api/test', responseType: 'text', signal: controller.signal })
    controller.abort()
    await expect(aborted).rejects.toMatchObject({ code: 'aborted' })

    const timedOut = network.request('luogu', { path: '/api/test', responseType: 'text', timeoutMs: 100 })
    const timeoutExpectation = expect(timedOut).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(100)
    await timeoutExpectation
  })
})
