import { describe, expect, it, vi } from 'vitest'
import type {
  BroadcastChannelPort,
  CrossTabPlatform,
} from '@exlg/browser'
import {
  LuoguPrivateMessageServiceImpl,
  RecentMessageIds,
} from '../src/private-messages'
import type {
  LuoguPrivateMessage,
  TimerScheduler,
  WebSocketLike,
} from '../src/private-messages'

class SingleTabChannel implements BroadcastChannelPort {
  readonly listeners = new Set<(event: MessageEvent<unknown>) => void>()
  closed = false
  postMessage(): void { /* no other tab */ }
  addEventListener(_type: 'message', listener: (event: MessageEvent<unknown>) => void): void {
    this.listeners.add(listener)
  }
  removeEventListener(_type: 'message', listener: (event: MessageEvent<unknown>) => void): void {
    this.listeners.delete(listener)
  }
  close(): void { this.closed = true }
}

class FakeSocket implements WebSocketLike {
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readonly sent: string[] = []
  readonly closeCalls: { code?: number; reason?: string }[] = []

  send(data: string): void { this.sent.push(data) }
  close(code?: number, reason?: string): void {
    this.closeCalls.push({
      ...(code === undefined ? {} : { code }),
      ...(reason === undefined ? {} : { reason }),
    })
  }
  open(): void { this.onopen?.({} as Event) }
  message(data: unknown): void { this.onmessage?.({ data } as MessageEvent<unknown>) }
  disconnected(): void { this.onclose?.({} as CloseEvent) }
}

class FakeTimers implements TimerScheduler {
  readonly tasks = new Map<number, { readonly callback: () => void; readonly delay: number }>()
  #id = 0
  setTimeout(callback: () => void, delay: number): unknown {
    const id = ++this.#id
    this.tasks.set(id, { callback, delay })
    return id
  }
  clearTimeout(handle: unknown): void { this.tasks.delete(handle as number) }
  runNext(): void {
    const next = this.tasks.entries().next().value as [number, { callback: () => void }] | undefined
    if (!next) return
    this.tasks.delete(next[0])
    next[1].callback()
  }
}

function validMessage(id: number, senderUid = 7): LuoguPrivateMessage {
  return {
    id,
    content: `message-${id}`,
    sender: { uid: senderUid, name: 'Sender' },
    receiver: { uid: 99, name: 'Current' },
  }
}

function frame(message: unknown): string {
  return JSON.stringify({ _ws_type: 'server_broadcast', message })
}

function setup() {
  const sockets: FakeSocket[] = []
  const timers = new FakeTimers()
  const channel = new SingleTabChannel()
  const platform: CrossTabPlatform = {
    createBroadcastChannel: () => channel,
    randomId: () => 'cryptographically-random-test-id',
  }
  const service = new LuoguPrivateMessageServiceImpl({
    session: { async currentUser() { return { uid: 99, name: 'Current' } } },
    origin: 'https://www.luogu.com.cn',
    fetch: async () => ({
      ok: true,
      async json() { return { ws: { server: 'wss://ws.luogu.com.cn/ws' } } },
    }),
    webSocketFactory: () => {
      const socket = new FakeSocket()
      sockets.push(socket)
      return socket
    },
    timers,
    crossTabPlatform: platform,
    random: () => 0.5,
  })
  return { service, sockets, timers, channel }
}

describe('LuoguPrivateMessageService WebSocket protocol', () => {
  it('sends the documented join packet with the current user UID', async () => {
    const { service, sockets } = setup()
    const controller = new AbortController()
    const cleanup = await service.subscribe(() => undefined, { signal: controller.signal })
    sockets[0]?.open()
    expect(sockets[0]?.sent).toEqual([JSON.stringify({
      type: 'join_channel',
      channel: 'chat',
      channel_param: '99',
      exclusive_key: null,
    })])
    await cleanup()
  })

  it('accepts a valid server_broadcast and ignores messages from self', async () => {
    const { service, sockets } = setup()
    const received: LuoguPrivateMessage[] = []
    const controller = new AbortController()
    const cleanup = await service.subscribe(message => received.push(message), { signal: controller.signal })
    sockets[0]?.message(frame(validMessage(1)))
    sockets[0]?.message(frame(validMessage(2, 99)))
    expect(received).toEqual([validMessage(1)])
    await cleanup()
  })

  it('rejects invalid JSON, message types, and malformed structures', async () => {
    const { service, sockets } = setup()
    const received = vi.fn()
    const controller = new AbortController()
    const cleanup = await service.subscribe(received, { signal: controller.signal })
    sockets[0]?.message('{')
    sockets[0]?.message(JSON.stringify({ _ws_type: 'other', message: validMessage(1) }))
    sockets[0]?.message(frame({ ...validMessage(2), id: '2' }))
    sockets[0]?.message(frame({ ...validMessage(3), content: 3 }))
    sockets[0]?.message(frame({ ...validMessage(4), sender: { uid: -1, name: 'Bad' } }))
    sockets[0]?.message(frame({ ...validMessage(5), receiver: { uid: 1 } }))
    expect(received).not.toHaveBeenCalled()
    await cleanup()
  })

  it('deduplicates repeated message IDs', async () => {
    const { service, sockets } = setup()
    const received = vi.fn()
    const controller = new AbortController()
    const cleanup = await service.subscribe(received, { signal: controller.signal })
    sockets[0]?.message(frame(validMessage(1)))
    sockets[0]?.message(frame(validMessage(1)))
    expect(received).toHaveBeenCalledOnce()
    await cleanup()
  })

  it('bounds the in-memory ID set to 256 entries', () => {
    const ids = new RecentMessageIds()
    for (let id = 1; id <= 257; id += 1) expect(ids.seen(id)).toBe(false)
    expect(ids.size).toBe(256)
    expect(ids.seen(1)).toBe(false)
    expect(ids.size).toBe(256)
  })

  it('reconnects with backoff after an unexpected close', async () => {
    const { service, sockets, timers } = setup()
    const controller = new AbortController()
    const cleanup = await service.subscribe(() => undefined, { signal: controller.signal })
    sockets[0]?.disconnected()
    expect([...timers.tasks.values()].map(task => task.delay)).toEqual([1_000])
    timers.runNext()
    expect(sockets).toHaveLength(2)
    await cleanup()
  })

  it('does not reconnect after cleanup and clears pending timers', async () => {
    const { service, sockets, timers, channel } = setup()
    const controller = new AbortController()
    const cleanup = await service.subscribe(() => undefined, { signal: controller.signal })
    sockets[0]?.disconnected()
    await cleanup()
    timers.runNext()
    expect(sockets).toHaveLength(1)
    expect(timers.tasks.size).toBe(0)
    expect(channel.closed).toBe(true)
  })

  it('ignores late events from an old socket generation', async () => {
    const { service, sockets, timers } = setup()
    const received = vi.fn()
    const controller = new AbortController()
    const cleanup = await service.subscribe(received, { signal: controller.signal })
    const oldMessageHandler = sockets[0]?.onmessage
    sockets[0]?.disconnected()
    timers.runNext()
    oldMessageHandler?.({ data: frame(validMessage(42)) } as MessageEvent<unknown>)
    expect(received).not.toHaveBeenCalled()
    expect(sockets).toHaveLength(2)
    await cleanup()
  })
})
