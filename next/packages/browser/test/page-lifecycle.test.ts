import { describe, expect, it, vi } from 'vitest'
import { installPageExitCleanup } from '../src/page-lifecycle'

class PageHideTargetStub {
  readonly #listeners = new Set<(event: PageTransitionEvent) => void>()

  addEventListener(_type: 'pagehide', listener: (event: PageTransitionEvent) => void): void {
    this.#listeners.add(listener)
  }

  removeEventListener(_type: 'pagehide', listener: (event: PageTransitionEvent) => void): void {
    this.#listeners.delete(listener)
  }

  dispatch(persisted: boolean): void {
    const event = { persisted } as PageTransitionEvent
    for (const listener of this.#listeners) listener(event)
  }
}

describe('page lifecycle cleanup', () => {
  it('survives a BFCache pagehide and cleans up on a final page exit', () => {
    const target = new PageHideTargetStub()
    const cleanup = vi.fn()
    const removeListener = installPageExitCleanup(target, cleanup)

    target.dispatch(true)
    expect(cleanup).not.toHaveBeenCalled()

    target.dispatch(false)
    expect(cleanup).toHaveBeenCalledOnce()

    removeListener()
    target.dispatch(false)
    expect(cleanup).toHaveBeenCalledOnce()
  })
})
