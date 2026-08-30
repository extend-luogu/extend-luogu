import { describe, expect, it } from 'vitest'
import type {
  Cleanup,
  FeatureStatusSnapshot,
  KernelController,
  RouteSnapshot,
  RouteSource,
} from '@exlg/runtime'
import {
  ControlCenterStore,
  createControlCenterPreferencesStore,
  defaultControlCenterPreferences,
  type ControlCenterPreferences,
  type ControlCenterPreferencesStore,
} from '../src'

function route(path: string, kind: RouteSnapshot['kind'] = 'home'): RouteSnapshot {
  const url = new URL(path, 'https://www.luogu.com.cn')
  return { key: `${url.pathname}${url.search}${url.hash}`, kind, url, params: {} }
}

class FakeRouteSource implements RouteSource {
  value = route('/')
  readonly listeners = new Set<(value: RouteSnapshot) => void>()
  current(): RouteSnapshot { return this.value }
  subscribe(listener: (value: RouteSnapshot) => void): Cleanup {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  emit(value: RouteSnapshot): void {
    this.value = value
    for (const listener of this.listeners) listener(value)
  }
}

class FakeKernel implements KernelController {
  readonly listeners = new Set<(value: FeatureStatusSnapshot) => void>()
  readonly states = new Map<string, FeatureStatusSnapshot>([['feature', { id: 'feature', status: 'idle' }]])
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  async setFeatureEnabled(): Promise<void> {}
  async remountFeature(): Promise<void> {}
  async retryFeature(): Promise<void> {}
  getFeatureStatus(id: string): FeatureStatusSnapshot { return this.states.get(id)! }
  subscribeFeatureStatus(listener: (value: FeatureStatusSnapshot) => void): Cleanup {
    this.listeners.add(listener)
    for (const value of this.states.values()) listener(value)
    return () => { this.listeners.delete(listener) }
  }
  emit(value: FeatureStatusSnapshot): void {
    this.states.set(value.id, value)
    for (const listener of this.listeners) listener(value)
  }
}

function preferencesStore(initial = defaultControlCenterPreferences): ControlCenterPreferencesStore {
  return {
    async load() { return initial },
    async save() {},
    async reset() {},
  }
}

describe('ControlCenterStore', () => {
  it('reads initial Kernel state and follows status and route updates', async () => {
    const kernel = new FakeKernel()
    const routes = new FakeRouteSource()
    const store = new ControlCenterStore({ kernel, routeSource: routes, preferences: preferencesStore() })
    await store.start()
    expect(store.getSnapshot().statuses.get('feature')?.status).toBe('idle')
    kernel.emit({ id: 'feature', status: 'mounted', routeKey: '/' })
    routes.emit(route('/problem/P1000', 'problem'))
    expect(store.getSnapshot().statuses.get('feature')?.status).toBe('mounted')
    expect(store.getSnapshot().route.kind).toBe('problem')
  })

  it('stops receiving updates after cleanup', async () => {
    const kernel = new FakeKernel()
    const routes = new FakeRouteSource()
    const store = new ControlCenterStore({ kernel, routeSource: routes, preferences: preferencesStore() })
    await store.start()
    await store.dispose()
    kernel.emit({ id: 'feature', status: 'error', lastError: 'late' })
    routes.emit(route('/late'))
    expect(store.getSnapshot().statuses.get('feature')?.status).toBe('idle')
    expect(store.getSnapshot().route.url.pathname).toBe('/')
    expect(kernel.listeners.size).toBe(0)
    expect(routes.listeners.size).toBe(0)
  })

  it('keeps at most twenty distinct observed errors', async () => {
    const kernel = new FakeKernel()
    const store = new ControlCenterStore({ kernel, routeSource: new FakeRouteSource(), preferences: preferencesStore() })
    await store.start()
    for (let index = 0; index < 25; index += 1) {
      kernel.emit({ id: 'feature', status: 'error', lastError: `error-${index}` })
    }
    expect(store.getSnapshot().errors).toHaveLength(20)
    expect(store.getSnapshot().errors[0]?.message).toBe('error-5')
  })

  it('falls back field-by-field when stored preferences are damaged', async () => {
    const preferences = createControlCenterPreferencesStore({
      async load() { return { theme: 'dark', density: 'huge', launcherSide: false, lastView: 'features' } },
      async save() {},
      async reset() {},
    })
    await expect(preferences.load()).resolves.toEqual({
      theme: 'dark',
      density: 'comfortable',
      launcherSide: 'right',
      lastView: 'features',
    })
  })

  it('does not let an older failed preference write roll back a newer one', async () => {
    const pending: { resolve: () => void; reject: (error: Error) => void }[] = []
    const preferences: ControlCenterPreferencesStore = {
      async load() { return defaultControlCenterPreferences },
      save() {
        return new Promise<void>((resolve, reject) => pending.push({ resolve, reject }))
      },
      async reset() {},
    }
    const store = new ControlCenterStore({ kernel: new FakeKernel(), routeSource: new FakeRouteSource(), preferences })
    await store.start()
    const dark: ControlCenterPreferences = { ...defaultControlCenterPreferences, theme: 'dark' }
    const compact: ControlCenterPreferences = { ...dark, density: 'compact' }
    const first = store.updatePreferences(dark).catch(error => error)
    const second = store.updatePreferences(compact)
    pending[1]!.resolve()
    await second
    pending[0]!.reject(new Error('old failure'))
    await first
    expect(store.getSnapshot().preferences).toEqual(compact)
  })
})
