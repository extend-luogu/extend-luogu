import { describe, expect, it, vi } from 'vitest'
import { resolveLuoguWebSocketUrl, validateLuoguWebSocketUrl } from '../src/websocket-config'

describe('Luogu WebSocket configuration', () => {
  it('requests /_lfe/config with same-origin credentials', async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      async json() { return { ws: { server: 'wss://ws.luogu.com.cn/ws' } } },
    }))
    await expect(resolveLuoguWebSocketUrl({
      origin: 'https://www.luogu.com.cn',
      fetch,
    })).resolves.toBe('wss://ws.luogu.com.cn/ws')
    expect(fetch).toHaveBeenCalledWith('https://www.luogu.com.cn/_lfe/config', {
      method: 'GET',
      credentials: 'include',
    })
  })

  it('rejects non-wss and non-Luogu endpoints', () => {
    expect(validateLuoguWebSocketUrl('ws://ws.luogu.com.cn/ws')).toBeNull()
    expect(validateLuoguWebSocketUrl('wss://attacker.example/ws')).toBeNull()
    expect(validateLuoguWebSocketUrl('wss://fake-luogu.com.cn.example/ws')).toBeNull()
  })

  it('uses the fixed fallback without logging response data', async () => {
    const warn = vi.fn()
    const fetch = vi.fn(async () => ({
      ok: true,
      async json() { return { ws: { server: 'wss://attacker.example/secret' } } },
    }))
    await expect(resolveLuoguWebSocketUrl({
      origin: 'https://www.luogu.com.cn',
      fetch,
      warn,
    })).resolves.toBe('wss://ws.luogu.com.cn/ws')
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls.flat().join(' ')).not.toContain('attacker')
  })
})
