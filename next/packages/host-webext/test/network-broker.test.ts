import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NetworkBrokerRequestMessage } from '../src/network-protocol'
import { createNetworkBroker } from '../src/network-broker-core'

function message(overrides: Partial<NetworkBrokerRequestMessage['request']> = {}): NetworkBrokerRequestMessage {
  return {
    type: 'exlg-network-request-v1', requestId: 'request-1',
    request: {
      target: 'cph-localhost', path: '/', method: 'POST', query: {},
      headers: { 'content-type': 'application/json' }, body: '{}', timeoutMs: 1_000,
      ...overrides,
    },
  }
}

afterEach(() => { vi.useRealTimers() })

function response(body: string, url: string, status = 200): Response {
  const result = new Response(body, { status })
  Object.defineProperty(result, 'url', { value: url })
  return result
}

describe('MV3 network broker', () => {
  it('chooses the fixed CPH origin and omits credentials and referrer', async () => {
    const fetcher = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      expect(init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' })
      return response('ok', String(input))
    })
    const result = await createNetworkBroker(fetcher).request(message())
    expect(result).toMatchObject({ ok: true, status: 200, finalUrl: 'http://localhost:27121/' })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('rejects arbitrary targets, paths, redirects, and oversized responses', async () => {
    const invalid = await createNetworkBroker(vi.fn() as typeof fetch).request(message({ path: '/evil' }))
    expect(invalid).toMatchObject({ ok: false, error: 'invalid-request' })

    const redirected = await createNetworkBroker(async () => response('ok', 'https://evil.test/')).request(message())
    expect(redirected).toMatchObject({ ok: false, error: 'redirect' })

    const oversized = await createNetworkBroker(async input =>
      response('x'.repeat(1024 * 1024 + 1), String(input))).request(message())
    expect(oversized).toMatchObject({ ok: false, error: 'response-too-large' })
  })

  it('supports cancellation and timeout without a real request', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn((_input: URL | RequestInfo, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    }))
    const broker = createNetworkBroker(fetcher)
    const cancelled = broker.request(message())
    broker.cancel('request-1')
    await expect(cancelled).resolves.toMatchObject({ ok: false, error: 'aborted' })

    const timedOut = createNetworkBroker(fetcher).request(message({ timeoutMs: 100 }))
    await vi.advanceTimersByTimeAsync(100)
    await expect(timedOut).resolves.toMatchObject({ ok: false, error: 'timeout' })
  })
})
