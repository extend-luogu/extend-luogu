import { describe, expect, it, vi } from 'vitest'
import { CrossTabCoordinator } from '../src'
import type {
  BroadcastChannelPort,
  CrossTabPlatform,
  ExclusiveLockManager,
} from '../src'

interface TestMessage {
  readonly id: number
}

class FakeBroadcastHub {
  readonly channels = new Set<FakeBroadcastChannel>()

  open(name: string): FakeBroadcastChannel {
    const channel = new FakeBroadcastChannel(this, name)
    this.channels.add(channel)
    return channel
  }

  publish(sender: FakeBroadcastChannel, value: unknown): void {
    for (const channel of this.channels) {
      if (channel !== sender && channel.name === sender.name && !channel.closed) {
        channel.deliver(value)
      }
    }
  }
}

class FakeBroadcastChannel implements BroadcastChannelPort {
  readonly listeners = new Set<(event: MessageEvent<unknown>) => void>()
  closed = false

  constructor(readonly hub: FakeBroadcastHub, readonly name: string) {}

  postMessage(message: unknown): void {
    this.hub.publish(this, message)
  }

  addEventListener(_type: 'message', listener: (event: MessageEvent<unknown>) => void): void {
    this.listeners.add(listener)
  }

  removeEventListener(_type: 'message', listener: (event: MessageEvent<unknown>) => void): void {
    this.listeners.delete(listener)
  }

  close(): void {
    this.closed = true
    this.listeners.clear()
  }

  deliver(data: unknown): void {
    for (const listener of this.listeners) listener({ data } as MessageEvent<unknown>)
  }
}

interface LockRequest {
  readonly signal: AbortSignal
  readonly callback: (lock: unknown) => Promise<void>
  readonly resolve: () => void
  readonly reject: (error: unknown) => void
  active: boolean
}

class FakeLocks implements ExclusiveLockManager {
  readonly requests: LockRequest[] = []
  #held = false

  request(
    _name: string,
    options: { readonly mode: 'exclusive'; readonly signal: AbortSignal },
    callback: (lock: unknown) => Promise<void>,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request: LockRequest = { signal: options.signal, callback, resolve, reject, active: false }
      this.requests.push(request)
      const abort = (): void => {
        if (request.active) return
        const index = this.requests.indexOf(request)
        if (index >= 0) this.requests.splice(index, 1)
        reject(new DOMException('Aborted', 'AbortError'))
      }
      options.signal.addEventListener('abort', abort, { once: true })
      this.#drain()
    })
  }

  #drain(): void {
    if (this.#held) return
    const request = this.requests.find(item => !item.active && !item.signal.aborted)
    if (!request) return
    this.#held = true
    request.active = true
    void request.callback({}).then(() => {
      const index = this.requests.indexOf(request)
      if (index >= 0) this.requests.splice(index, 1)
      this.#held = false
      request.resolve()
      this.#drain()
    }, error => {
      this.#held = false
      request.reject(error)
      this.#drain()
    })
  }
}

function platform(hub: FakeBroadcastHub, locks?: ExclusiveLockManager): CrossTabPlatform {
  let id = 0
  return {
    ...(locks ? { locks } : {}),
    createBroadcastChannel: name => hub.open(name),
    randomId: () => `random-${++id}-${Math.random()}`,
  }
}

function coordinator(
  signal: AbortSignal,
  target: TestMessage[],
  sharedPlatform: CrossTabPlatform,
): CrossTabCoordinator<TestMessage> {
  return new CrossTabCoordinator({
    channelName: 'messages',
    lockName: 'socket',
    signal,
    platform: sharedPlatform,
    parseMessage: value => {
      if (typeof value !== 'object' || value === null || !('id' in value)) return null
      return typeof value.id === 'number' ? { id: value.id } : null
    },
    onMessage: message => target.push(message),
  })
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

function holdUntilAbort(signal: AbortSignal): Promise<void> {
  return new Promise(resolve => signal.addEventListener('abort', () => resolve(), { once: true }))
}

describe('CrossTabCoordinator', () => {
  it('allows only one leader when locks are supported', async () => {
    const hub = new FakeBroadcastHub()
    const locks = new FakeLocks()
    const shared = platform(hub, locks)
    const first = coordinator(new AbortController().signal, [], shared)
    const second = coordinator(new AbortController().signal, [], shared)
    const leaders = vi.fn()
    first.startLeader(signal => { leaders('first'); return holdUntilAbort(signal) })
    second.startLeader(signal => { leaders('second'); return holdUntilAbort(signal) })
    await flush()
    expect(leaders).toHaveBeenCalledTimes(1)
    first.dispose()
    second.dispose()
  })

  it('delivers a leader broadcast to leader and follower exactly once', async () => {
    const hub = new FakeBroadcastHub()
    const shared = platform(hub, new FakeLocks())
    const leaderMessages: TestMessage[] = []
    const followerMessages: TestMessage[] = []
    const leader = coordinator(new AbortController().signal, leaderMessages, shared)
    const follower = coordinator(new AbortController().signal, followerMessages, shared)
    leader.publish({ id: 1 })
    expect(leaderMessages).toEqual([{ id: 1 }])
    expect(followerMessages).toEqual([{ id: 1 }])
    leader.dispose()
    follower.dispose()
  })

  it('promotes a follower after the leader is disposed', async () => {
    const hub = new FakeBroadcastHub()
    const locks = new FakeLocks()
    const shared = platform(hub, locks)
    const first = coordinator(new AbortController().signal, [], shared)
    const second = coordinator(new AbortController().signal, [], shared)
    const leaders: string[] = []
    first.startLeader(signal => { leaders.push('first'); return holdUntilAbort(signal) })
    second.startLeader(signal => { leaders.push('second'); return holdUntilAbort(signal) })
    await flush()
    first.dispose()
    await flush()
    expect(leaders).toEqual(['first', 'second'])
    second.dispose()
  })

  it('closes its BroadcastChannel during cleanup', () => {
    const hub = new FakeBroadcastHub()
    const instance = coordinator(new AbortController().signal, [], platform(hub))
    instance.dispose()
    expect([...hub.channels].every(channel => channel.closed)).toBe(true)
  })

  it('cancels lock waiting when aborted', async () => {
    const hub = new FakeBroadcastHub()
    const locks = new FakeLocks()
    const shared = platform(hub, locks)
    const first = coordinator(new AbortController().signal, [], shared)
    const followerAbort = new AbortController()
    const second = coordinator(followerAbort.signal, [], shared)
    const leaders: string[] = []
    first.startLeader(signal => { leaders.push('first'); return holdUntilAbort(signal) })
    second.startLeader(signal => { leaders.push('second'); return holdUntilAbort(signal) })
    await flush()
    followerAbort.abort()
    first.dispose()
    await flush()
    expect(leaders).toEqual(['first'])
  })

  it('uses one local leader per tab when locks are unavailable', async () => {
    const hub = new FakeBroadcastHub()
    const shared = platform(hub)
    const first = coordinator(new AbortController().signal, [], shared)
    const second = coordinator(new AbortController().signal, [], shared)
    const leaders = vi.fn()
    first.startLeader(signal => { leaders(); return holdUntilAbort(signal) })
    second.startLeader(signal => { leaders(); return holdUntilAbort(signal) })
    await flush()
    expect(leaders).toHaveBeenCalledTimes(2)
    first.dispose()
    second.dispose()
  })
})
