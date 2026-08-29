import { describe, expect, it, vi } from 'vitest'
import { createScope } from '../src/index'

describe('Scope', () => {
  it('runs cleanup in LIFO order', async () => {
    const calls: number[] = []
    const scope = createScope()
    scope.add(() => { calls.push(1) })
    scope.add(() => { calls.push(2) })
    await scope.dispose()
    expect(calls).toEqual([2, 1])
  })

  it('is idempotent', async () => {
    const cleanup = vi.fn()
    const scope = createScope()
    scope.add(cleanup)
    await Promise.all([scope.dispose(), scope.dispose()])
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('disposes child scopes with their parent', async () => {
    const cleanup = vi.fn()
    const parent = createScope()
    parent.child().add(cleanup)
    await parent.dispose()
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('aborts before cleanup', async () => {
    const scope = createScope()
    let abortedDuringCleanup = false
    scope.add(() => {
      abortedDuringCleanup = scope.signal.aborted
    })
    await scope.dispose()
    expect(abortedDuringCleanup).toBe(true)
  })

  it('continues after cleanup throws', async () => {
    const errors: unknown[] = []
    const cleanup = vi.fn()
    const scope = createScope(error => errors.push(error))
    scope.add(cleanup)
    scope.add(() => {
      throw new Error('broken cleanup')
    })
    await scope.dispose()
    expect(cleanup).toHaveBeenCalledOnce()
    expect(errors).toHaveLength(1)
  })

  it('runs cleanup added after disposal immediately', async () => {
    const cleanup = vi.fn()
    const scope = createScope()
    await scope.dispose()
    scope.add(cleanup)
    await Promise.resolve()
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('awaits async cleanup', async () => {
    let release: (() => void) | undefined
    let finished = false
    const scope = createScope()
    scope.add(async () => {
      await new Promise<void>(resolve => {
        release = resolve
      })
      finished = true
    })
    const disposing = scope.dispose()
    await Promise.resolve()
    expect(finished).toBe(false)
    release?.()
    await disposing
    expect(finished).toBe(true)
  })
})
