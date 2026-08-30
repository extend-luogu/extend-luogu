import { describe, expect, it, vi } from 'vitest'
import {
  LuoguSessionServiceImpl,
  readSanitizedCurrentUser,
} from '../src/session'
import type { SessionProbe } from '../src/session'

describe('Luogu current-user bridge boundary', () => {
  it('reads _feInstance.currentUser', () => {
    expect(readSanitizedCurrentUser({
      _feInstance: { currentUser: { uid: 12, name: 'Alice' } },
    })).toEqual({ ready: true, user: { uid: 12, name: 'Alice' } })
  })

  it('falls back to _feInjection.currentUser', () => {
    expect(readSanitizedCurrentUser({
      _feInjection: { currentUser: { uid: 34, name: 'Bob' } },
    })).toEqual({ ready: true, user: { uid: 34, name: 'Bob' } })
  })

  it('reports unavailable state without throwing', () => {
    expect(readSanitizedCurrentUser({})).toEqual({ ready: false, user: null })
  })

  it('rejects an invalid UID type', () => {
    expect(readSanitizedCurrentUser({
      _feInstance: { currentUser: { uid: '12', name: 'Alice' } },
    })).toEqual({ ready: true, user: null })
  })

  it('does not carry extra page fields across the boundary', () => {
    const result = readSanitizedCurrentUser({
      _feInstance: {
        currentUser: {
          uid: 12,
          name: 'Alice',
          token: 'must-not-cross',
          csrf: 'must-not-cross',
          nested: { secret: true },
        },
      },
    })
    expect(result).toEqual({ ready: true, user: { uid: 12, name: 'Alice' } })
    expect(Object.keys(result.user ?? {})).toEqual(['uid', 'name'])
  })
})

describe('LuoguSessionService', () => {
  it('returns null after a finite number of unavailable probes', async () => {
    const read = vi.fn(async () => ({ ready: false, user: null }))
    const probe: SessionProbe = { read }
    const service = new LuoguSessionServiceImpl(probe, {
      attempts: 3,
      retryDelayMs: 0,
      wait: async () => undefined,
    })
    await expect(service.currentUser()).resolves.toBeNull()
    expect(read).toHaveBeenCalledTimes(3)
  })

  it('honors AbortSignal while waiting', async () => {
    const probe: SessionProbe = {
      async read() { return { ready: false, user: null } },
    }
    let releaseWait: (() => void) | undefined
    const service = new LuoguSessionServiceImpl(probe, {
      attempts: 3,
      wait: (_delay, signal) => new Promise<void>((resolve, reject) => {
        releaseWait = resolve
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }),
    })
    const controller = new AbortController()
    const pending = service.currentUser({ signal: controller.signal })
    await Promise.resolve()
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    releaseWait?.()
  })
})
