/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RestrictedNetworkTransportRequest } from '@exlg/browser'
import { createUserscriptNetworkTransport } from '../src/platform'

afterEach(() => { vi.unstubAllGlobals() })

function request(signal = new AbortController().signal): RestrictedNetworkTransportRequest {
  return {
    target: 'codeforces', path: '/api/contest.standings', method: 'GET',
    query: { contestId: '1' }, headers: { accept: 'application/json' },
    credentials: 'omit', timeoutMs: 1_000, signal,
  }
}

describe('UserScript network transport', () => {
  it('uses anonymous GM requests for fixed cross-origin targets', async () => {
    const send = vi.fn((options: Parameters<typeof GM_xmlhttpRequest>[0]) => {
      queueMicrotask(() => options.onload({
        status: 200, responseText: '{}', finalUrl: options.url,
      }))
      return { abort() {} }
    })
    vi.stubGlobal('GM_xmlhttpRequest', send)
    const result = await createUserscriptNetworkTransport(window).request(request())
    expect(send).toHaveBeenCalledOnce()
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      url: 'https://codeforces.com/api/contest.standings?contestId=1',
      anonymous: true,
      method: 'GET',
    })
    expect(result).toMatchObject({ status: 200, body: '{}' })
  })

  it('aborts the GM handle when the Feature signal is aborted', async () => {
    const abort = vi.fn()
    const send = vi.fn((options: Parameters<typeof GM_xmlhttpRequest>[0]) => {
      const handle = { abort: () => { abort(); options.onabort() } }
      return handle
    })
    vi.stubGlobal('GM_xmlhttpRequest', send)
    const controller = new AbortController()
    const pending = createUserscriptNetworkTransport(window).request(request(controller.signal))
    controller.abort()
    await expect(pending).rejects.toThrow('aborted')
    expect(abort).toHaveBeenCalledOnce()
  })
})
