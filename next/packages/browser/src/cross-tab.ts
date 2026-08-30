export interface BroadcastChannelPort {
  postMessage(message: unknown): void
  addEventListener(type: 'message', listener: (event: MessageEvent<unknown>) => void): void
  removeEventListener(type: 'message', listener: (event: MessageEvent<unknown>) => void): void
  close(): void
}

export interface ExclusiveLockManager {
  request(
    name: string,
    options: { readonly mode: 'exclusive'; readonly signal: AbortSignal },
    callback: (lock: unknown) => Promise<void>,
  ): Promise<void>
}

export interface CrossTabPlatform {
  readonly locks?: ExclusiveLockManager
  createBroadcastChannel(name: string): BroadcastChannelPort
  randomId(): string
}

export interface CrossTabCoordinatorOptions<Message> {
  readonly channelName: string
  readonly lockName: string
  readonly signal: AbortSignal
  readonly platform: CrossTabPlatform
  readonly parseMessage: (value: unknown) => Message | null
  readonly onMessage: (message: Message) => void
  readonly onWarning?: (message: string) => void
}

type LeaderTask = (signal: AbortSignal) => Promise<void>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Coordinates one leader task while distributing validated messages to every tab. */
export class CrossTabCoordinator<Message> {
  readonly #channel: BroadcastChannelPort
  readonly #controller = new AbortController()
  readonly #sourceId: string
  readonly #options: CrossTabCoordinatorOptions<Message>
  #leaderController: AbortController | undefined
  #started = false
  #disposed = false

  constructor(options: CrossTabCoordinatorOptions<Message>) {
    this.#options = options
    this.#sourceId = options.platform.randomId()
    this.#channel = options.platform.createBroadcastChannel(options.channelName)
    this.#channel.addEventListener('message', this.#acceptBroadcast)
    if (options.signal.aborted) this.dispose()
    else options.signal.addEventListener('abort', this.#acceptExternalAbort, { once: true })
  }

  startLeader(task: LeaderTask): void {
    if (this.#started || this.#disposed) return
    this.#started = true
    const locks = this.#options.platform.locks
    if (!locks) {
      this.#startFallbackLeader(task)
      return
    }
    void locks.request(
      this.#options.lockName,
      { mode: 'exclusive', signal: this.#controller.signal },
      async () => this.#holdLeadership(task),
    ).catch(error => {
      if (this.#controller.signal.aborted) return
      this.#options.onWarning?.('跨标签页锁不可用，当前标签页使用独立连接')
      this.#startFallbackLeader(task)
      void error
    })
  }

  publish(message: Message): void {
    if (this.#disposed) return
    this.#options.onMessage(message)
    this.#channel.postMessage({
      kind: 'private-message',
      sourceId: this.#sourceId,
      payload: message,
    })
  }

  dispose(): void {
    if (this.#disposed) return
    this.#disposed = true
    this.#controller.abort()
    this.#leaderController?.abort()
    this.#leaderController = undefined
    this.#options.signal.removeEventListener('abort', this.#acceptExternalAbort)
    this.#channel.removeEventListener('message', this.#acceptBroadcast)
    this.#channel.close()
  }

  readonly #acceptExternalAbort = (): void => this.dispose()

  readonly #acceptBroadcast = (event: MessageEvent<unknown>): void => {
    if (this.#disposed || !isRecord(event.data)) return
    if (event.data.kind !== 'private-message') return
    if (typeof event.data.sourceId !== 'string' || event.data.sourceId === this.#sourceId) return
    const message = this.#options.parseMessage(event.data.payload)
    if (message !== null) this.#options.onMessage(message)
  }

  async #holdLeadership(task: LeaderTask): Promise<void> {
    if (this.#controller.signal.aborted) return
    const controller = new AbortController()
    this.#leaderController = controller
    const abort = (): void => controller.abort()
    this.#controller.signal.addEventListener('abort', abort, { once: true })
    try {
      await task(controller.signal)
    }
    catch (error) {
      if (!controller.signal.aborted) {
        this.#options.onWarning?.('跨标签页 leader 任务异常结束')
        void error
      }
    }
    finally {
      this.#controller.signal.removeEventListener('abort', abort)
      controller.abort()
      if (this.#leaderController === controller) this.#leaderController = undefined
    }
  }

  #startFallbackLeader(task: LeaderTask): void {
    if (this.#disposed || this.#leaderController) return
    void this.#holdLeadership(task)
  }
}

export function createNativeCrossTabPlatform(target: Window & typeof globalThis): CrossTabPlatform {
  const locks = target.navigator.locks
    ? {
        async request(
          name: string,
          options: { readonly mode: 'exclusive'; readonly signal: AbortSignal },
          callback: (lock: unknown) => Promise<void>,
        ): Promise<void> {
          await target.navigator.locks.request(name, options, async lock => callback(lock))
        },
      }
    : undefined
  return {
    ...(locks ? { locks } : {}),
    createBroadcastChannel: name => new target.BroadcastChannel(name),
    randomId: () => {
      if (typeof target.crypto.randomUUID === 'function') return target.crypto.randomUUID()
      const values = new Uint32Array(4)
      target.crypto.getRandomValues(values)
      return [...values].map(value => value.toString(16).padStart(8, '0')).join('-')
    },
  }
}
