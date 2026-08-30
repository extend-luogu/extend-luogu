/** @vitest-environment jsdom */

import {
  BrowserFeatureServices,
  createDomEnvironment,
  FeatureConfigurationController,
} from '@exlg/browser'
import type { JsonKeyValueStore } from '@exlg/browser'
import type {
  LuoguFeatureContextExtension,
  LuoguPrivateMessage,
  LuoguPrivateMessageService,
} from '@exlg/luogu'
import {
  createScope,
  defineFeature,
} from '@exlg/runtime'
import type {
  AnyFeatureDefinition,
  JsonValue,
  RouteSnapshot,
} from '@exlg/runtime'
import { Kernel } from '@exlg/runtime/internal'
import type { FeatureContextFactory } from '@exlg/runtime/internal'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import privateMessageNotifier from '../../../features/private-message-notifier'

class MemoryStore implements JsonKeyValueStore {
  readonly values = new Map<string, unknown>()
  async get(key: string): Promise<unknown> { return this.values.get(key) }
  async set(key: string, value: JsonValue): Promise<void> { this.values.set(key, value) }
  async delete(key: string): Promise<void> { this.values.delete(key) }
}

function route(kind: RouteSnapshot['kind'], path: string): RouteSnapshot {
  const url = new URL(path, 'https://www.luogu.com.cn')
  return { kind, key: `${url.pathname}${url.search}${url.hash}`, url, params: {} }
}

function message(id: number, name = 'Sender', content = `message-${id}`): LuoguPrivateMessage {
  return { id, content, sender: { uid: 7, name } }
}

async function setupFeature(
  currentRoute: RouteSnapshot,
  values: Record<string, string | boolean> = {},
) {
  const store = new MemoryStore()
  store.values.set('exlg:vnext:settings:official.private-message-notifier', {
    settingsVersion: 1,
    values,
  })
  const browser = new BrowserFeatureServices({
    store,
    configuration: new FeatureConfigurationController(store),
    clipboard: { async writeText() { /* unused */ } },
    dom: createDomEnvironment(document),
  })
  let sink: ((value: LuoguPrivateMessage) => void) | undefined
  const transportCleanup = vi.fn()
  const privateMessages: LuoguPrivateMessageService = {
    async subscribe(listener) {
      sink = listener
      return transportCleanup
    },
  }
  const luogu = { privateMessages }
  const featureScope = createScope()
  type ActivationContext = Parameters<NonNullable<typeof privateMessageNotifier.activate>>[0]
  const activationContext = ({ ...browser.activation(privateMessageNotifier, featureScope), luogu } as unknown) as ActivationContext
  const activationCleanup = await privateMessageNotifier.activate?.(activationContext)
  if (typeof activationCleanup === 'function') featureScope.add(activationCleanup)
  const mountScope = featureScope.child()
  type NotifierMountContext = Parameters<NonNullable<typeof privateMessageNotifier.mount>>[0]
  const mountContext = ({ ...browser.mount(privateMessageNotifier, mountScope, currentRoute), luogu } as unknown) as NotifierMountContext
  const mountCleanup = await privateMessageNotifier.mount?.(mountContext)
  if (typeof mountCleanup === 'function') mountScope.add(mountCleanup)
  return {
    emit(value: LuoguPrivateMessage) { sink?.(value) },
    featureScope,
    mountScope,
    transportCleanup,
  }
}

function shadowRoot(): ShadowRoot | null {
  return document.querySelector<HTMLElement>('.exlg-next-private-messages-host')?.shadowRoot ?? null
}

beforeEach(() => {
  document.body.textContent = ''
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  document.body.textContent = ''
})

describe('official.private-message-notifier renderer', () => {
  it('does not mount reminder UI on chat routes', async () => {
    const setup = await setupFeature(route('chat', '/chat'))
    expect(shadowRoot()).toBeNull()
    await setup.featureScope.dispose()
  })

  it('renders validated message data as text on other routes', async () => {
    const setup = await setupFeature(route('problem', '/problem/P1000'))
    setup.emit(message(1, '<img id="bad">', '<script id="payload">bad</script>'))
    const root = shadowRoot()
    expect(root?.querySelector('.name')?.textContent).toBe('<img id="bad">')
    expect(root?.querySelector('.preview')?.textContent).toBe('<script id="payload">bad</script>')
    expect(root?.querySelector('#bad')).toBeNull()
    expect(root?.querySelector('#payload')).toBeNull()
    expect(root?.querySelectorAll('img')).toHaveLength(1)
    expect(root?.querySelector<HTMLAnchorElement>('.view')?.href).toBe('https://www.luogu.com.cn/chat')
    await setup.featureScope.dispose()
  })

  it('hides the preview without storing or rendering the body', async () => {
    const setup = await setupFeature(route('home', '/'), { showPreview: false })
    setup.emit(message(1, 'Sender', 'private body'))
    expect(shadowRoot()?.querySelector('.preview')?.textContent).toBe('收到一条新私信')
    expect(shadowRoot()?.textContent).not.toContain('private body')
    await setup.featureScope.dispose()
  })

  it('removes the oldest card at maxVisible', async () => {
    const setup = await setupFeature(route('home', '/'), { maxVisible: '3', dismissAfter: '0' })
    for (let id = 1; id <= 4; id += 1) setup.emit(message(id))
    const cards = shadowRoot()?.querySelectorAll<HTMLElement>('.card') ?? []
    expect(cards).toHaveLength(3)
    expect([...cards].map(card => card.dataset.messageId)).toEqual(['2', '3', '4'])
    await setup.featureScope.dispose()
  })

  it('automatically removes a card at the configured time', async () => {
    const setup = await setupFeature(route('home', '/'), { dismissAfter: '5' })
    setup.emit(message(1))
    expect(shadowRoot()?.querySelectorAll('.card')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(shadowRoot()?.querySelectorAll('.card')).toHaveLength(0)
    await setup.featureScope.dispose()
  })

  it('keeps cards when dismissAfter is zero', async () => {
    const setup = await setupFeature(route('home', '/'), { dismissAfter: '0' })
    setup.emit(message(1))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(shadowRoot()?.querySelectorAll('.card')).toHaveLength(1)
    await setup.featureScope.dispose()
  })

  it('mount cleanup removes the host and all timers without closing transport', async () => {
    const setup = await setupFeature(route('home', '/'), { dismissAfter: '60' })
    setup.emit(message(1))
    expect(vi.getTimerCount()).toBe(1)
    await setup.mountScope.dispose()
    expect(shadowRoot()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    expect(setup.transportCleanup).not.toHaveBeenCalled()
    await setup.featureScope.dispose()
  })

  it('feature disable clears transport and mounted UI', async () => {
    const setup = await setupFeature(route('home', '/'))
    setup.emit(message(1))
    await setup.featureScope.dispose()
    expect(setup.transportCleanup).toHaveBeenCalledOnce()
    expect(shadowRoot()).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('private-message feature isolation', () => {
  it('does not prevent another feature when its service fails', async () => {
    const healthyMount = vi.fn()
    const healthy = defineFeature({
      id: 'healthy',
      apiVersion: 1,
      title: 'healthy',
      description: 'healthy',
      category: 'test',
      defaultEnabled: true,
      matches: () => true,
      capabilities: [],
      settings: {},
      mount: healthyMount,
    })
    const catalog = [privateMessageNotifier, healthy] as unknown as readonly AnyFeatureDefinition<LuoguFeatureContextExtension>[]
    const store = new MemoryStore()
    const browser = new BrowserFeatureServices({
      store,
      configuration: new FeatureConfigurationController(store),
      clipboard: { async writeText() { /* unused */ } },
      dom: createDomEnvironment(document),
    })
    const luogu = {
      privateMessages: {
        async subscribe(): Promise<never> { throw new Error('transport unavailable') },
      },
    }
    const contextFactory: FeatureContextFactory<LuoguFeatureContextExtension> = {
      activation: (feature, scope) => ({ ...browser.activation(feature, scope), luogu }),
      mount: (feature, scope, currentRoute) => ({ ...browser.mount(feature, scope, currentRoute), luogu }),
    }
    const currentRoute = route('home', '/')
    const kernel = new Kernel<LuoguFeatureContextExtension>({
      catalog,
      routeSource: { current: () => currentRoute, subscribe: () => () => undefined },
      enabledStore: {
        async load() { return { 'official.private-message-notifier': true } },
        async set() { /* unused */ },
      },
      contextFactory,
    })
    await kernel.start()
    for (let attempt = 0; attempt < 10 && healthyMount.mock.calls.length === 0; attempt += 1) {
      await Promise.resolve()
    }
    expect(kernel.getFeatureStatus('official.private-message-notifier').status).toBe('error')
    expect(healthyMount).toHaveBeenCalledOnce()
    await kernel.stop()
  })
})
