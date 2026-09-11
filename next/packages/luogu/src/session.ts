import type { Cleanup } from '@exlg/runtime'

export interface LuoguCurrentUser {
  readonly uid: number
  readonly name?: string
}

export interface LuoguSessionService {
  currentUser(options?: { readonly signal?: AbortSignal }): Promise<LuoguCurrentUser | null>
}

export interface SessionProbeResult {
  readonly ready: boolean
  readonly user: LuoguCurrentUser | null
}

export interface SessionProbe {
  read(signal?: AbortSignal): Promise<SessionProbeResult>
}

export const SESSION_REQUEST_EVENT = 'exlg:vnext:session-request'
export const SESSION_RESPONSE_EVENT = 'exlg:vnext:session-response'

interface SessionServiceOptions {
  readonly attempts?: number
  readonly retryDelayMs?: number
  readonly wait?: (delay: number, signal?: AbortSignal) => Promise<void>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeUser(value: unknown): LuoguCurrentUser | null {
  if (!isRecord(value) || !Number.isSafeInteger(value.uid) || Number(value.uid) <= 0) return null
  const user: { uid: number; name?: string } = { uid: Number(value.uid) }
  if (typeof value.name === 'string') user.name = value.name
  return user
}

function stateCandidate(value: unknown): { readonly available: boolean; readonly user: LuoguCurrentUser | null } {
  if (!isRecord(value) || !('currentUser' in value) || value.currentUser === undefined) {
    return { available: false, user: null }
  }
  return { available: true, user: sanitizeUser(value.currentUser) }
}

/** Reads and sanitizes the only page-world fields allowed across the bridge. */
export function readSanitizedCurrentUser(page: unknown): SessionProbeResult {
  if (!isRecord(page)) return { ready: false, user: null }
  const candidates = [stateCandidate(page._feInstance), stateCandidate(page._feInjection)]
  for (const candidate of candidates) {
    if (candidate.user) return { ready: true, user: candidate.user }
  }
  return {
    ready: candidates.some(candidate => candidate.available),
    user: null,
  }
}

export function installSessionBridge(target: Window & typeof globalThis): Cleanup {
  const respond = (event: Event): void => {
    const detail = (event as CustomEvent<unknown>).detail
    if (!isRecord(detail) || typeof detail.requestId !== 'string') return
    let result: SessionProbeResult = { ready: false, user: null }
    try { result = readSanitizedCurrentUser(target) }
    catch { /* page-owned getters are treated as not ready */ }
    target.document.dispatchEvent(new target.CustomEvent(SESSION_RESPONSE_EVENT, {
      detail: {
        requestId: detail.requestId,
        ready: result.ready,
        user: result.user,
      },
    }))
  }
  target.document.addEventListener(SESSION_REQUEST_EVENT, respond)
  return () => target.document.removeEventListener(SESSION_REQUEST_EVENT, respond)
}

export class WindowSessionProbe implements SessionProbe {
  readonly #target: Window & typeof globalThis
  readonly #timeoutMs: number

  constructor(target: Window & typeof globalThis, timeoutMs = 150) {
    this.#target = target
    this.#timeoutMs = timeoutMs
  }

  read(signal?: AbortSignal): Promise<SessionProbeResult> {
    if (signal?.aborted) return Promise.reject(abortError())
    return new Promise<SessionProbeResult>((resolve, reject) => {
      const requestId = this.#target.crypto.randomUUID()
      let settled = false
      const finish = (result: SessionProbeResult): void => {
        if (settled) return
        settled = true
        cleanup()
        resolve(result)
      }
      const receive = (event: Event): void => {
        const detail = (event as CustomEvent<unknown>).detail
        if (!isRecord(detail) || detail.requestId !== requestId || typeof detail.ready !== 'boolean') return
        finish({ ready: detail.ready, user: sanitizeUser(detail.user) })
      }
      const abort = (): void => {
        if (settled) return
        settled = true
        cleanup()
        reject(abortError())
      }
      const timeout = this.#target.setTimeout(() => finish({ ready: false, user: null }), this.#timeoutMs)
      const cleanup = (): void => {
        this.#target.clearTimeout(timeout)
        this.#target.document.removeEventListener(SESSION_RESPONSE_EVENT, receive)
        signal?.removeEventListener('abort', abort)
      }
      this.#target.document.addEventListener(SESSION_RESPONSE_EVENT, receive)
      signal?.addEventListener('abort', abort, { once: true })
      this.#target.document.dispatchEvent(new this.#target.CustomEvent(SESSION_REQUEST_EVENT, {
        detail: { requestId },
      }))
    })
  }
}

export class LuoguSessionServiceImpl implements LuoguSessionService {
  readonly #probe: SessionProbe
  readonly #attempts: number
  readonly #retryDelayMs: number
  readonly #wait: (delay: number, signal?: AbortSignal) => Promise<void>

  constructor(probe: SessionProbe, options: SessionServiceOptions = {}) {
    this.#probe = probe
    this.#attempts = options.attempts ?? 20
    this.#retryDelayMs = options.retryDelayMs ?? 250
    this.#wait = options.wait ?? waitWithAbort
  }

  async currentUser(options: { readonly signal?: AbortSignal } = {}): Promise<LuoguCurrentUser | null> {
    const { signal } = options
    for (let attempt = 0; attempt < this.#attempts; attempt += 1) {
      if (signal?.aborted) throw abortError()
      const result = await this.#probe.read(signal)
      if (result.ready) return result.user
      if (attempt + 1 < this.#attempts) await this.#wait(this.#retryDelayMs, signal)
    }
    return null
  }
}

export function createLuoguSessionService(
  target: Window & typeof globalThis,
): LuoguSessionService {
  return new LuoguSessionServiceImpl(new WindowSessionProbe(target))
}

function waitWithAbort(delay: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError())
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, delay)
    const abort = (): void => {
      clearTimeout(timeout)
      reject(abortError())
    }
    signal?.addEventListener('abort', abort, { once: true })
  })
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted', 'AbortError')
}
