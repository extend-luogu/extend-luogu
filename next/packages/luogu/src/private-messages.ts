import { CrossTabCoordinator } from '@exlg/browser'
import type { CrossTabPlatform } from '@exlg/browser'
import type { Cleanup } from '@exlg/runtime'
import type { LuoguSessionService } from './session'
import type { LuoguEditorService } from './editor'
import type { LuoguPageDataService } from './page-data'
import { resolveLuoguWebSocketUrl } from './websocket-config'
import type { LuoguFetch } from './websocket-config'

export interface LuoguPrivateMessageUser {
  readonly uid: number
  readonly name: string
}

export interface LuoguPrivateMessage {
  readonly id: number
  readonly content: string
  readonly sender: LuoguPrivateMessageUser
  readonly receiver?: LuoguPrivateMessageUser
}

export interface LuoguPrivateMessageService {
  subscribe(
    listener: (message: LuoguPrivateMessage) => void,
    options: { readonly signal: AbortSignal },
  ): Promise<Cleanup>
}

export interface LuoguFeatureServices {
  readonly privateMessages: LuoguPrivateMessageService
  readonly editor: LuoguEditorService
  readonly pageData: LuoguPageDataService
}

export interface LuoguFeatureContextExtension {
  readonly luogu: LuoguFeatureServices
}

export interface WebSocketLike {
  onopen: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent<unknown>) => void) | null
  onclose: ((event: CloseEvent) => void) | null
  onerror: ((event: Event) => void) | null
  send(data: string): void
  close(code?: number, reason?: string): void
}

export interface TimerScheduler {
  setTimeout(callback: () => void, delay: number): unknown
  clearTimeout(handle: unknown): void
}

interface PrivateMessageServiceOptions {
  readonly session: LuoguSessionService
  readonly origin: string
  readonly fetch: LuoguFetch
  readonly webSocketFactory: (url: string) => WebSocketLike
  readonly timers: TimerScheduler
  readonly crossTabPlatform: CrossTabPlatform
  readonly random?: () => number
  readonly debug?: (message: string) => void
  readonly warn?: (message: string) => void
}

const reconnectDelays = [1_000, 2_000, 4_000, 8_000, 15_000] as const
const CHANNEL_NAME = 'exlg:vnext:private-message-broadcast'
const LOCK_NAME = 'exlg:vnext:private-message-socket'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeUser(value: unknown): LuoguPrivateMessageUser | null {
  if (!isRecord(value)) return null
  if (!Number.isSafeInteger(value.uid) || Number(value.uid) <= 0) return null
  if (typeof value.name !== 'string') return null
  return { uid: Number(value.uid), name: value.name }
}

export function normalizePrivateMessage(value: unknown): LuoguPrivateMessage | null {
  if (!isRecord(value) || !Number.isSafeInteger(value.id)) return null
  if (typeof value.content !== 'string') return null
  const sender = normalizeUser(value.sender)
  if (!sender) return null
  const receiver = value.receiver === undefined ? undefined : normalizeUser(value.receiver)
  if (value.receiver !== undefined && !receiver) return null
  return {
    id: Number(value.id),
    content: value.content,
    sender,
    ...(receiver ? { receiver } : {}),
  }
}

export function parsePrivateMessageFrame(value: unknown): LuoguPrivateMessage | null {
  if (typeof value !== 'string') return null
  try {
    const frame: unknown = JSON.parse(value)
    if (!isRecord(frame) || frame._ws_type !== 'server_broadcast') return null
    return normalizePrivateMessage(frame.message)
  }
  catch {
    return null
  }
}

export class RecentMessageIds {
  readonly #limit: number
  readonly #ids = new Set<number>()

  constructor(limit = 256) {
    this.#limit = limit
  }

  seen(id: number): boolean {
    if (this.#ids.has(id)) return true
    this.#ids.add(id)
    if (this.#ids.size > this.#limit) {
      const oldest = this.#ids.values().next().value as number | undefined
      if (oldest !== undefined) this.#ids.delete(oldest)
    }
    return false
  }

  get size(): number {
    return this.#ids.size
  }
}

export class LuoguPrivateMessageServiceImpl implements LuoguPrivateMessageService {
  readonly #options: PrivateMessageServiceOptions

  constructor(options: PrivateMessageServiceOptions) {
    this.#options = options
  }

  async subscribe(
    listener: (message: LuoguPrivateMessage) => void,
    options: { readonly signal: AbortSignal },
  ): Promise<Cleanup> {
    const { signal } = options
    const currentUser = await this.#options.session.currentUser({ signal })
    if (!currentUser || signal.aborted) return () => undefined
    const server = await resolveLuoguWebSocketUrl({
      origin: this.#options.origin,
      fetch: this.#options.fetch,
      signal,
      ...(this.#options.warn ? { warn: this.#options.warn } : {}),
    })
    if (signal.aborted) return () => undefined

    const ids = new RecentMessageIds()
    const deliver = (message: LuoguPrivateMessage): void => {
      if (message.sender.uid === currentUser.uid || ids.seen(message.id)) return
      try {
        listener(message)
      }
      catch {
        this.#options.warn?.('私信监听器拒绝了一条已验证消息')
      }
    }
    const coordinator = new CrossTabCoordinator<LuoguPrivateMessage>({
      channelName: CHANNEL_NAME,
      lockName: LOCK_NAME,
      signal,
      platform: this.#options.crossTabPlatform,
      parseMessage: normalizePrivateMessage,
      onMessage: deliver,
      ...(this.#options.warn ? { onWarning: this.#options.warn } : {}),
    })
    coordinator.startLeader(leaderSignal => this.#runSocket(
      server,
      currentUser.uid,
      leaderSignal,
      message => coordinator.publish(message),
    ))
    return () => coordinator.dispose()
  }

  #runSocket(
    server: string,
    currentUserUid: number,
    signal: AbortSignal,
    publish: (message: LuoguPrivateMessage) => void,
  ): Promise<void> {
    return new Promise(resolve => {
      let current: { readonly socket: WebSocketLike; readonly generation: number } | undefined
      let reconnectTimer: unknown
      let generation = 0
      let reconnectAttempt = 0
      let finished = false

      const active = (socket: WebSocketLike, socketGeneration: number): boolean => (
        !finished
        && !signal.aborted
        && current?.socket === socket
        && current.generation === socketGeneration
      )
      const clearReconnect = (): void => {
        if (reconnectTimer === undefined) return
        this.#options.timers.clearTimeout(reconnectTimer)
        reconnectTimer = undefined
      }
      const scheduleReconnect = (): void => {
        if (finished || signal.aborted || reconnectTimer !== undefined) return
        const base = reconnectDelays[Math.min(reconnectAttempt, reconnectDelays.length - 1)]!
        reconnectAttempt += 1
        const jitter = 0.9 + (this.#options.random ?? Math.random)() * 0.2
        reconnectTimer = this.#options.timers.setTimeout(() => {
          reconnectTimer = undefined
          connect()
        }, Math.round(base * jitter))
      }
      const detach = (socket: WebSocketLike): void => {
        socket.onopen = null
        socket.onmessage = null
        socket.onclose = null
        socket.onerror = null
      }
      const retire = (socket: WebSocketLike, socketGeneration: number): void => {
        if (!active(socket, socketGeneration)) return
        current = undefined
        detach(socket)
        try { socket.close() }
        catch { /* a reconnect is still scheduled */ }
        scheduleReconnect()
      }
      const connect = (): void => {
        if (finished || signal.aborted || current) return
        let socket: WebSocketLike
        try {
          socket = this.#options.webSocketFactory(server)
        }
        catch {
          this.#options.warn?.('私信 WebSocket 创建失败，稍后重试')
          scheduleReconnect()
          return
        }
        const socketGeneration = ++generation
        current = { socket, generation: socketGeneration }
        socket.onopen = () => {
          if (!active(socket, socketGeneration)) return
          try {
            socket.send(JSON.stringify({
              type: 'join_channel',
              channel: 'chat',
              channel_param: String(currentUserUid),
              exclusive_key: null,
            }))
          }
          catch {
            retire(socket, socketGeneration)
          }
        }
        socket.onmessage = event => {
          if (!active(socket, socketGeneration)) return
          const message = parsePrivateMessageFrame(event.data)
          if (message) publish(message)
          else this.#options.debug?.('忽略了无法识别的私信 WebSocket 帧')
        }
        socket.onerror = () => {
          if (active(socket, socketGeneration)) {
            this.#options.debug?.('私信 WebSocket 报告连接错误')
          }
        }
        socket.onclose = () => {
          if (!active(socket, socketGeneration)) return
          current = undefined
          detach(socket)
          scheduleReconnect()
        }
      }
      const stop = (): void => {
        if (finished) return
        finished = true
        generation += 1
        clearReconnect()
        const socket = current?.socket
        current = undefined
        if (socket) {
          detach(socket)
          try { socket.close(1000, 'scope-disposed') }
          catch { /* cleanup continues */ }
        }
        signal.removeEventListener('abort', stop)
        resolve()
      }

      signal.addEventListener('abort', stop, { once: true })
      if (signal.aborted) stop()
      else connect()
    })
  }
}

export function createLuoguPrivateMessageService(
  options: PrivateMessageServiceOptions,
): LuoguPrivateMessageService {
  return new LuoguPrivateMessageServiceImpl(options)
}
