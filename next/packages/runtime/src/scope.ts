import type { Cleanup, Scope } from './types'

type ScopeErrorHandler = (error: unknown) => void

interface CleanupEntry {
  readonly run: Cleanup
}

export class ScopeImpl implements Scope {
  readonly #controller = new AbortController()
  readonly #cleanups: CleanupEntry[] = []
  readonly #lateCleanups = new Set<Promise<void>>()
  readonly #onError: ScopeErrorHandler
  #disposed = false
  #disposePromise: Promise<void> | undefined

  constructor(onError: ScopeErrorHandler = () => undefined) {
    this.#onError = onError
  }

  get signal(): AbortSignal {
    return this.#controller.signal
  }

  get disposed(): boolean {
    return this.#disposed
  }

  add(cleanup: Cleanup): Cleanup {
    let completed = false
    const run = async (): Promise<void> => {
      if (completed) return
      completed = true
      try {
        await cleanup()
      }
      catch (error) {
        this.#onError(error)
      }
    }

    if (this.#disposed) {
      const pending = run()
      this.#lateCleanups.add(pending)
      void pending.finally(() => this.#lateCleanups.delete(pending))
    }
    else {
      this.#cleanups.push({ run })
    }
    return run
  }

  child(): Scope {
    const child = new ScopeImpl(this.#onError)
    this.add(() => child.dispose())
    return child
  }

  dispose(): Promise<void> {
    if (this.#disposePromise) return this.#disposePromise
    this.#disposed = true
    this.#controller.abort()
    this.#disposePromise = this.#runDispose()
    return this.#disposePromise
  }

  async #runDispose(): Promise<void> {
    for (let index = this.#cleanups.length - 1; index >= 0; index -= 1) {
      await this.#cleanups[index]?.run()
    }
    this.#cleanups.length = 0
    while (this.#lateCleanups.size > 0) {
      await Promise.all([...this.#lateCleanups])
    }
  }
}

/** Creates a root scope. Cleanup failures are reported but never rethrown. */
export function createScope(onError?: ScopeErrorHandler): Scope {
  return new ScopeImpl(onError)
}
