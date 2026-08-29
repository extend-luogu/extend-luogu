import { describe, expect, it, vi } from 'vitest'
import { defineFeature } from '../src/index'
import type {
  AnyFeatureDefinition,
  FeatureContext,
  MountContext,
  RouteSnapshot,
  Scope,
  SettingsSchema,
  SettingsValues,
} from '../src/index'
import { Kernel } from '../src/internal'
import type { FeatureContextFactory, FeatureEnabledStore } from '../src/internal'

class FakeRouteSource {
  #route = route('home', '/')
  readonly #listeners = new Set<(value: RouteSnapshot) => void>()

  current(): RouteSnapshot {
    return this.#route
  }

  subscribe(listener: (value: RouteSnapshot) => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  emit(value: RouteSnapshot): void {
    this.#route = value
    for (const listener of this.#listeners) listener(value)
  }
}

class MemoryEnabledStore implements FeatureEnabledStore {
  readonly values: Record<string, boolean> = {}
  async load(): Promise<Readonly<Record<string, boolean>>> {
    return this.values
  }
  async set(id: string, enabled: boolean): Promise<void> {
    this.values[id] = enabled
  }
}

type AnySettings = SettingsValues<SettingsSchema>

const contextFactory: FeatureContextFactory = {
  activation: (_feature, scope) => context(scope),
  mount: (_feature, scope, currentRoute) => ({ ...context(scope), route: currentRoute }),
}

function context(scope: Scope): FeatureContext<AnySettings> {
  return {
    scope,
    signal: scope.signal,
    settings: {
      async get() { return undefined as never },
      async getAll() { return {} as AnySettings },
      async set() { /* test double */ },
    },
    storage: {
      async get<T>() { return undefined as T | undefined },
      async set() { /* test double */ },
      async delete() { /* test double */ },
      async update<T>(_key: string, updater: (value: T | undefined) => T) {
        return updater(undefined)
      },
    },
    dom: {} as FeatureContext<AnySettings>['dom'],
    clipboard: { async writeText() { /* test double */ } },
    log: {
      debug() { /* test double */ },
      info() { /* test double */ },
      warn() { /* test double */ },
      error() { /* test double */ },
    },
  }
}

function route(kind: RouteSnapshot['kind'], path: string): RouteSnapshot {
  const url = new URL(path, 'https://www.luogu.com.cn')
  return { kind, key: `${url.pathname}${url.search}${url.hash}`, url, params: {} }
}

function feature(
  id: string,
  hooks: {
    activate?: (context: FeatureContext<Record<string, never>>) => void | (() => void) | Promise<void | (() => void)>
    mount?: (context: MountContext<Record<string, never>>) => void | (() => void) | Promise<void | (() => void)>
    matches?: (value: RouteSnapshot) => boolean
    defaultEnabled?: boolean
  },
): AnyFeatureDefinition {
  const definition = {
    id,
    apiVersion: 1 as const,
    title: id,
    description: id,
    category: 'test',
    defaultEnabled: hooks.defaultEnabled ?? true,
    capabilities: [] as const,
    settings: {} as const,
    matches: hooks.matches ?? (() => true),
    ...(hooks.activate ? { activate: hooks.activate } : {}),
    ...(hooks.mount ? { mount: hooks.mount } : {}),
  }
  return defineFeature(definition) as AnyFeatureDefinition
}

function setup(catalog: readonly AnyFeatureDefinition[]) {
  const routes = new FakeRouteSource()
  const enabled = new MemoryEnabledStore()
  const errors: unknown[] = []
  const kernel = new Kernel({
    catalog,
    routeSource: routes,
    enabledStore: enabled,
    contextFactory,
    reportError: (_id, error) => errors.push(error),
  })
  return { kernel, routes, enabled, errors }
}

async function eventually(assertion: () => void): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      assertion()
      return
    }
    catch {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
  assertion()
}

describe('Kernel feature runtime', () => {
  it('activates a feature when it is enabled after start', async () => {
    const activate = vi.fn()
    const { kernel } = setup([feature('one', { activate, defaultEnabled: false })])
    await kernel.start()
    expect(activate).not.toHaveBeenCalled()
    await kernel.setFeatureEnabled('one', true)
    await eventually(() => expect(activate).toHaveBeenCalledOnce())
  })

  it('activates enabled features and mounts matching routes', async () => {
    const activate = vi.fn()
    const mount = vi.fn()
    const { kernel } = setup([feature('one', { activate, mount })])
    await kernel.start()
    await eventually(() => expect(mount).toHaveBeenCalledOnce())
    expect(activate).toHaveBeenCalledOnce()
    expect(kernel.getFeatureStatus('one').status).toBe('mounted')
  })

  it('keeps a non-matching feature idle', async () => {
    const mount = vi.fn()
    const { kernel } = setup([feature('one', { mount, matches: value => value.kind === 'problem' })])
    await kernel.start()
    await eventually(() => expect(kernel.getFeatureStatus('one').status).toBe('idle'))
    expect(mount).not.toHaveBeenCalled()
  })

  it('cleans the old mount before mounting a new route key', async () => {
    const calls: string[] = []
    const { kernel, routes } = setup([feature('one', {
      mount: ctx => {
        calls.push(`mount:${ctx.route.key}`)
        return () => calls.push(`cleanup:${ctx.route.key}`)
      },
    })])
    await kernel.start()
    await eventually(() => expect(calls).toHaveLength(1))
    routes.emit(route('problem', '/problem/P1000'))
    await eventually(() => expect(calls).toHaveLength(3))
    expect(calls).toEqual(['mount:/', 'cleanup:/', 'mount:/problem/P1000'])
  })

  it('disabling cleans mount and activation resources', async () => {
    const calls: string[] = []
    const { kernel } = setup([feature('one', {
      activate: () => () => calls.push('activate cleanup'),
      mount: () => () => calls.push('mount cleanup'),
    })])
    await kernel.start()
    await eventually(() => expect(kernel.getFeatureStatus('one').status).toBe('mounted'))
    await kernel.setFeatureEnabled('one', false)
    expect(calls).toEqual(['mount cleanup', 'activate cleanup'])
    expect(kernel.getFeatureStatus('one').status).toBe('disabled')
  })

  it('remount applies changes without restarting activation', async () => {
    const activate = vi.fn()
    const cleanup = vi.fn()
    const mount = vi.fn(() => cleanup)
    const { kernel } = setup([feature('one', { activate, mount })])
    await kernel.start()
    await eventually(() => expect(mount).toHaveBeenCalledOnce())
    await kernel.remountFeature('one')
    await eventually(() => expect(mount).toHaveBeenCalledTimes(2))
    expect(cleanup).toHaveBeenCalledOnce()
    expect(activate).toHaveBeenCalledOnce()
  })

  it('isolates one feature failure from another feature', async () => {
    const healthy = vi.fn()
    const { kernel } = setup([
      feature('broken', { activate: () => { throw new Error('boom') } }),
      feature('healthy', { mount: healthy }),
    ])
    await kernel.start()
    await eventually(() => expect(kernel.getFeatureStatus('broken').status).toBe('error'))
    await eventually(() => expect(healthy).toHaveBeenCalledOnce())
  })

  it('immediately runs a late mount cleanup after a route change', async () => {
    let resolveMount: ((cleanup: () => void) => void) | undefined
    const staleCleanup = vi.fn()
    const mounts: string[] = []
    const { kernel, routes } = setup([feature('one', {
      mount: async ctx => {
        mounts.push(ctx.route.key)
        if (ctx.route.key === '/') {
          return new Promise<() => void>(resolve => { resolveMount = resolve })
        }
        return undefined
      },
    })])
    await kernel.start()
    await eventually(() => expect(mounts).toEqual(['/']))
    routes.emit(route('problem', '/problem/P1000'))
    await eventually(() => expect(mounts).toEqual(['/', '/problem/P1000']))
    resolveMount?.(staleCleanup)
    await eventually(() => expect(staleCleanup).toHaveBeenCalledOnce())
  })

  it('does not leak a late mount cleanup after disable', async () => {
    let resolveMount: ((cleanup: () => void) => void) | undefined
    const cleanup = vi.fn()
    const { kernel } = setup([feature('one', {
      mount: () => new Promise<() => void>(resolve => { resolveMount = resolve }),
    })])
    await kernel.start()
    await eventually(() => expect(kernel.getFeatureStatus('one').status).toBe('mounting'))
    await kernel.setFeatureEnabled('one', false)
    resolveMount?.(cleanup)
    await eventually(() => expect(cleanup).toHaveBeenCalledOnce())
    expect(kernel.getFeatureStatus('one').status).toBe('disabled')
  })

  it('does not leak a late activate cleanup after disable', async () => {
    let resolveActivate: ((cleanup: () => void) => void) | undefined
    const cleanup = vi.fn()
    const { kernel } = setup([feature('one', {
      activate: () => new Promise<() => void>(resolve => { resolveActivate = resolve }),
    })])
    await kernel.start()
    await kernel.setFeatureEnabled('one', false)
    resolveActivate?.(cleanup)
    await eventually(() => expect(cleanup).toHaveBeenCalledOnce())
  })

  it('retry restarts a failed feature', async () => {
    let attempts = 0
    const mount = vi.fn()
    const { kernel } = setup([feature('one', {
      activate: () => {
        attempts += 1
        if (attempts === 1) throw new Error('first failure')
      },
      mount,
    })])
    await kernel.start()
    await eventually(() => expect(kernel.getFeatureStatus('one').status).toBe('error'))
    await kernel.retryFeature('one')
    await eventually(() => expect(kernel.getFeatureStatus('one').status).toBe('mounted'))
    expect(attempts).toBe(2)
    expect(mount).toHaveBeenCalledOnce()
  })

  it('stop cleans every feature', async () => {
    const cleanupOne = vi.fn()
    const cleanupTwo = vi.fn()
    const { kernel } = setup([
      feature('one', { mount: () => cleanupOne }),
      feature('two', { mount: () => cleanupTwo }),
    ])
    await kernel.start()
    await eventually(() => expect(kernel.getFeatureStatus('two').status).toBe('mounted'))
    await kernel.stop()
    expect(cleanupOne).toHaveBeenCalledOnce()
    expect(cleanupTwo).toHaveBeenCalledOnce()
  })
})
