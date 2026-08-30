/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, getByLabelText, getByRole, getByText, queryByText, waitFor } from '@testing-library/dom'
import {
  defineFeature,
  setting,
  type Cleanup,
  type FeatureMetadata,
  type FeatureStatusSnapshot,
  type KernelController,
  type RouteSnapshot,
  type RouteSource,
} from '@exlg/runtime'
import {
  defaultControlCenterPreferences,
  mountControlCenter,
  type ControlCenterPreferences,
  type FeatureConfigurationController,
  type SettingValue,
} from '../src'

const alpha = defineFeature({
  id: 'official.alpha', apiVersion: 1, title: '代码阅读助手', description: '改善代码阅读体验', category: 'reading',
  defaultEnabled: true, matches: () => true, capabilities: ['dom', 'clipboard'],
  settings: {
    flag: setting.boolean({ title: '显示标记', description: '显示额外标记', default: true }),
    label: setting.string({ title: '按钮文本', description: '自定义按钮内容', default: '复制' }),
    mode: setting.select({ title: '布局模式', default: 'a', options: [{ value: 'a', label: '标准' }, { value: 'b', label: '紧凑' }] }),
    count: setting.number({ title: '显示数量', default: 4, min: 2, max: 10, step: 2, integer: true }),
    groups: setting.multiSelect({
      title: '启用分组', default: ['a'],
      options: [{ value: 'a', label: '分组 A' }, { value: 'b', label: '分组 B' }],
    }),
  },
})
const beta = defineFeature({
  id: 'official.beta', apiVersion: 1, title: '本地笔记', description: '保存题目笔记', category: 'problem',
  defaultEnabled: false, matches: route => route.kind === 'problem', capabilities: ['storage'],
  settings: { placeholder: setting.string({ title: '输入提示', default: '记录思路' }) },
})
const catalog: readonly FeatureMetadata[] = [alpha, beta]

function makeRoute(path = '/', kind: RouteSnapshot['kind'] = 'home'): RouteSnapshot {
  const url = new URL(path, 'https://www.luogu.com.cn')
  return { key: `${url.pathname}${url.search}${url.hash}`, kind, url, params: {} }
}

class FakeRouteSource implements RouteSource {
  readonly listeners = new Set<(route: RouteSnapshot) => void>()
  value = makeRoute()
  current(): RouteSnapshot { return this.value }
  subscribe(listener: (route: RouteSnapshot) => void): Cleanup {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
}

class FakeKernel implements KernelController {
  readonly states = new Map<string, FeatureStatusSnapshot>([
    [alpha.id, { id: alpha.id, status: 'mounted', routeKey: '/' }],
    [beta.id, { id: beta.id, status: 'disabled' }],
  ])
  readonly listeners = new Set<(status: FeatureStatusSnapshot) => void>()
  failToggle = false
  readonly setFeatureEnabled = vi.fn(async (id: string, enabled: boolean) => {
    if (this.failToggle) throw new Error('toggle failed')
    this.emit({ id, status: enabled ? 'mounted' : 'disabled', ...(enabled ? { routeKey: '/' } : {}) })
  })
  readonly remountFeature = vi.fn(async () => undefined)
  readonly retryFeature = vi.fn(async (id: string) => this.emit({ id, status: 'mounted', routeKey: '/' }))
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  getFeatureStatus(id: string): FeatureStatusSnapshot { return this.states.get(id)! }
  subscribeFeatureStatus(listener: (status: FeatureStatusSnapshot) => void): Cleanup {
    this.listeners.add(listener)
    for (const status of this.states.values()) listener(status)
    return () => { this.listeners.delete(listener) }
  }
  emit(status: FeatureStatusSnapshot): void {
    this.states.set(status.id, status)
    for (const listener of this.listeners) listener(status)
  }
}

class FakeConfiguration implements FeatureConfigurationController {
  readonly values = new Map<string, Record<string, SettingValue>>([
    [alpha.id, { flag: true, label: '复制', mode: 'a', count: 4, groups: ['a'] }],
    [beta.id, { placeholder: '记录思路' }],
  ])
  readonly data = new Map([['exlg:vnext:data:official.beta', 'private note']])
  readonly set = vi.fn(async (feature: FeatureMetadata, name: string, value: SettingValue) => {
    this.values.set(feature.id, { ...this.values.get(feature.id), [name]: value })
  })
  readonly setMany = vi.fn(async (feature: FeatureMetadata, values: Readonly<Record<string, SettingValue>>) => {
    this.values.set(feature.id, { ...this.values.get(feature.id), ...values })
  })
  readonly reset = vi.fn(async (feature: FeatureMetadata) => { this.values.delete(feature.id) })
  async getAll(feature: FeatureMetadata): Promise<Readonly<Record<string, SettingValue>>> {
    return this.values.get(feature.id) ?? Object.fromEntries(Object.entries(feature.settings).map(([name, definition]) => [name, definition.default]))
  }
}

let currentCleanup: Cleanup | undefined
let kernel: FakeKernel
let routes: FakeRouteSource
let configuration: FakeConfiguration

function shadow(): HTMLElement {
  return document.querySelector<HTMLElement>('#exlg-next-control-center-host')!
    .shadowRoot!.querySelector<HTMLElement>('.control-center-root')!
}

function mount(): void {
  kernel = new FakeKernel()
  routes = new FakeRouteSource()
  configuration = new FakeConfiguration()
  let preferences = defaultControlCenterPreferences
  currentCleanup = mountControlCenter({
    document,
    catalog,
    kernel,
    routeSource: routes,
    configuration,
    preferences: {
      async load() { return preferences },
      async save(next: ControlCenterPreferences) { preferences = next },
      async reset() { preferences = defaultControlCenterPreferences },
    },
    clipboard: { writeText: vi.fn(async () => undefined) },
    environment: { host: 'userscript', version: '0.1.0', development: true },
  })
}

async function openFeatures(): Promise<HTMLElement> {
  const root = shadow()
  fireEvent.click(getByRole(root, 'button', { name: '打开 ExLG Next 控制中心' }))
  await waitFor(() => expect(getByRole(root, 'dialog')).toBeTruthy())
  fireEvent.click(getByRole(root, 'button', { name: '功能' }))
  return root
}

beforeEach(() => {
  document.body.textContent = ''
  mount()
})

afterEach(async () => {
  await currentCleanup?.()
  currentCleanup = undefined
  document.body.textContent = ''
})

describe('Control Center lifecycle and accessibility', () => {
  it('opens from Launcher, moves focus inside, closes with Escape, and restores focus', async () => {
    const root = shadow()
    const launcher = getByRole(root, 'button', { name: '打开 ExLG Next 控制中心' })
    expect(launcher.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(launcher)
    await waitFor(() => expect((root.getRootNode() as ShadowRoot).activeElement).toBe(getByRole(root, 'dialog')))
    expect(getByRole(root, 'button', { name: '关闭 ExLG Next 控制中心' }).getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(queryByText(root, '控制中心')).toBeNull())
    expect((root.getRootNode() as ShadowRoot).activeElement).toBe(launcher)
  })

  it('toggles with Alt+Shift+E and closes through the backdrop', async () => {
    const root = shadow()
    fireEvent.keyDown(document, { key: 'E', altKey: true, shiftKey: true })
    await waitFor(() => expect(getByRole(root, 'dialog')).toBeTruthy())
    fireEvent.click(root.querySelector<HTMLButtonElement>('.backdrop')!)
    await waitFor(() => expect(root.querySelector('.panel')).toBeNull())
  })

  it('opens Feature search with Ctrl/Cmd+K and moves focus to it', async () => {
    const root = shadow()
    fireEvent.click(getByRole(root, 'button', { name: '打开 ExLG Next 控制中心' }))
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const search = await waitFor(() => getByRole(root, 'searchbox'))
    expect((root.getRootNode() as ShadowRoot).activeElement).toBe(search)
  })

  it('removes host and subscriptions on idempotent cleanup', async () => {
    expect(kernel.listeners.size).toBe(1)
    expect(routes.listeners.size).toBe(1)
    await currentCleanup?.()
    await currentCleanup?.()
    expect(document.querySelector('#exlg-next-control-center-host')).toBeNull()
    expect(kernel.listeners.size).toBe(0)
    expect(routes.listeners.size).toBe(0)
    currentCleanup = undefined
  })
})

describe('Feature catalog management', () => {
  it('shows the complete catalog and searches title, ID, and setting title', async () => {
    const root = await openFeatures()
    expect(getByText(root, '代码阅读助手')).toBeTruthy()
    expect(getByText(root, '本地笔记')).toBeTruthy()
    const alphaRow = getByText(root, '代码阅读助手').closest<HTMLElement>('.feature-row')!
    const capabilityBadges = alphaRow.querySelectorAll('.capability-badge')
    expect([...capabilityBadges].map(item => item.textContent)).toEqual(['页面内容', '剪贴板'])
    const compactStatus = root.querySelector<HTMLElement>('.feature-row .feature-status--compact')
    expect(compactStatus?.querySelector('.sr-only')?.textContent).toBe('正在运行')
    const search = getByRole(root, 'searchbox')
    fireEvent.input(search, { target: { value: 'official.beta' } })
    await waitFor(() => expect(queryByText(root, '代码阅读助手')).toBeNull())
    expect(getByText(root, '本地笔记')).toBeTruthy()
    fireEvent.input(search, { target: { value: '显示标记' } })
    await waitFor(() => expect(getByText(root, '代码阅读助手')).toBeTruthy())
  })

  it('filters category and status', async () => {
    const root = await openFeatures()
    fireEvent.change(getByLabelText(root, '分类'), { target: { value: 'problem' } })
    await waitFor(() => expect(queryByText(root, '代码阅读助手')).toBeNull())
    expect(getByText(root, '本地笔记')).toBeTruthy()
    fireEvent.change(getByLabelText(root, '分类'), { target: { value: 'all' } })
    fireEvent.change(getByLabelText(root, '状态'), { target: { value: 'disabled' } })
    await waitFor(() => expect(queryByText(root, '代码阅读助手')).toBeNull())
    expect(getByText(root, '本地笔记')).toBeTruthy()
  })

  it('toggles through Kernel and reports a failed toggle without optimistic drift', async () => {
    const root = await openFeatures()
    let betaToggle = getByRole(root, 'switch', { name: '本地笔记开关' }) as HTMLInputElement
    fireEvent.change(betaToggle, { target: { checked: true } })
    await waitFor(() => expect(kernel.setFeatureEnabled).toHaveBeenCalledWith(beta.id, true))
    await waitFor(() => {
      betaToggle = getByRole(root, 'switch', { name: '本地笔记开关' }) as HTMLInputElement
      expect(betaToggle.disabled).toBe(false)
      expect(betaToggle.checked).toBe(true)
    })
    kernel.failToggle = true
    betaToggle = getByRole(root, 'switch', { name: '本地笔记开关' }) as HTMLInputElement
    fireEvent.change(betaToggle, { target: { checked: false } })
    await waitFor(() => expect(getByText(root, /操作失败：toggle failed/)).toBeTruthy())
    expect((getByRole(root, 'switch', { name: '本地笔记开关' }) as HTMLInputElement).checked).toBe(true)
  })

  it('shows retry for an errored Feature and opens and returns from detail', async () => {
    const root = await openFeatures()
    kernel.emit({ id: alpha.id, status: 'error', lastError: 'broken' })
    await waitFor(() => expect(getByRole(root, 'button', { name: /重试/ })).toBeTruthy())
    fireEvent.click(getByRole(root, 'button', { name: '配置代码阅读助手' }))
    await waitFor(() => expect(getByText(root, 'FEATURE DETAIL')).toBeTruthy())
    fireEvent.click(getByRole(root, 'button', { name: '返回功能列表' }))
    await waitFor(() => expect(getByRole(root, 'searchbox')).toBeTruthy())
  })
})

describe('Feature settings', () => {
  it('toggles the Feature directly from its detail page and reports failures', async () => {
    const root = await openFeatures()
    fireEvent.click(getByText(root, '本地笔记'))
    let toggle = await waitFor(() => getByRole(root, 'switch', { name: '本地笔记开关' }) as HTMLInputElement)
    expect(toggle.checked).toBe(false)
    fireEvent.change(toggle, { target: { checked: true } })
    await waitFor(() => expect(kernel.setFeatureEnabled).toHaveBeenCalledWith(beta.id, true))
    toggle = getByRole(root, 'switch', { name: '本地笔记开关' }) as HTMLInputElement
    expect(toggle.checked).toBe(true)

    kernel.failToggle = true
    fireEvent.change(toggle, { target: { checked: false } })
    await waitFor(() => expect(getByText(root, /启停失败：toggle failed/)).toBeTruthy())
    expect((getByRole(root, 'switch', { name: '本地笔记开关' }) as HTMLInputElement).checked).toBe(true)
  })

  it('saves boolean/select immediately, string on blur, and remounts enabled Feature', async () => {
    const root = await openFeatures()
    fireEvent.click(getByText(root, '代码阅读助手'))
    await waitFor(() => expect(getByRole(root, 'switch', { name: '显示标记' })).toBeTruthy())
    fireEvent.click(getByRole(root, 'switch', { name: '显示标记' }))
    fireEvent.change(getByLabelText(root, '布局模式'), { target: { value: 'b' } })
    const input = getByLabelText(root, /按钮文本/) as HTMLInputElement
    fireEvent.input(input, { target: { value: '新文字' } })
    await waitFor(() => expect(configuration.set).toHaveBeenCalledTimes(2))
    fireEvent.blur(input)
    await waitFor(() => expect(configuration.set).toHaveBeenCalledWith(alpha, 'label', '新文字'))
    await waitFor(() => expect(kernel.remountFeature).toHaveBeenCalled())
    const enterInput = getByLabelText(root, /按钮文本/) as HTMLInputElement
    await waitFor(() => expect(enterInput.disabled).toBe(false))
    fireEvent.input(enterInput, { target: { value: '回车保存' } })
    fireEvent.keyDown(enterInput, { key: 'Enter' })
    await waitFor(() => expect(configuration.set).toHaveBeenCalledWith(alpha, 'label', '回车保存'))
  })

  it('saves number on blur and multi-select as a stable array', async () => {
    const root = await openFeatures()
    fireEvent.click(getByText(root, '代码阅读助手'))
    const count = await waitFor(() => getByLabelText(root, /显示数量/) as HTMLInputElement)
    expect(count.type).toBe('number')
    expect(count.min).toBe('2')
    expect(count.max).toBe('10')
    expect(count.step).toBe('2')
    fireEvent.input(count, { target: { value: '6' } })
    fireEvent.blur(count)
    await waitFor(() => expect(configuration.set).toHaveBeenCalledWith(alpha, 'count', 6))

    fireEvent.click(getByLabelText(root, '分组 B'))
    await waitFor(() => expect(configuration.set).toHaveBeenCalledWith(alpha, 'groups', ['a', 'b']))
  })

  it('saves a disabled Feature without starting or remounting it', async () => {
    const root = await openFeatures()
    fireEvent.click(getByText(root, '本地笔记'))
    const input = await waitFor(() => getByLabelText(root, '输入提示') as HTMLInputElement)
    fireEvent.input(input, { target: { value: '新的提示' } })
    fireEvent.blur(input)
    await waitFor(() => expect(configuration.set).toHaveBeenCalledWith(beta, 'placeholder', '新的提示'))
    expect(kernel.remountFeature).not.toHaveBeenCalled()
    expect(kernel.setFeatureEnabled).not.toHaveBeenCalled()
  })

  it('requires confirmation before reset and preserves Feature data', async () => {
    const root = await openFeatures()
    fireEvent.click(getByText(root, '本地笔记'))
    await waitFor(() => expect(getByRole(root, 'button', { name: '恢复本功能默认设置' })).toBeTruthy())
    fireEvent.click(getByRole(root, 'button', { name: '恢复本功能默认设置' }))
    await waitFor(() => expect(getByRole(root, 'alertdialog')).toBeTruthy())
    expect(configuration.reset).not.toHaveBeenCalled()
    fireEvent.click(getByRole(root, 'button', { name: '恢复默认设置' }))
    await waitFor(() => expect(configuration.reset).toHaveBeenCalledWith(beta))
    expect(configuration.data.get('exlg:vnext:data:official.beta')).toBe('private note')
  })

  it('ignores a stale settings load after switching Feature detail', async () => {
    let resolveAlpha: ((value: Readonly<Record<string, SettingValue>>) => void) | undefined
    vi.spyOn(configuration, 'getAll').mockImplementation(feature => {
      if (feature.id === alpha.id) {
        return new Promise(resolve => { resolveAlpha = resolve })
      }
      return Promise.resolve({ placeholder: 'beta-current' })
    })
    const root = await openFeatures()
    fireEvent.click(getByText(root, '代码阅读助手'))
    await waitFor(() => expect(getByText(root, 'FEATURE DETAIL')).toBeTruthy())
    fireEvent.click(getByRole(root, 'button', { name: '返回功能列表' }))
    await waitFor(() => expect(getByRole(root, 'searchbox')).toBeTruthy())
    fireEvent.click(getByText(root, '本地笔记'))
    const betaInput = await waitFor(() => getByLabelText(root, '输入提示') as HTMLInputElement)
    expect(betaInput.value).toBe('beta-current')
    resolveAlpha?.({ flag: false, label: 'stale-alpha', mode: 'b' })
    await Promise.resolve()
    expect(getByText(root, 'FEATURE DETAIL').nextElementSibling?.textContent).toBe('本地笔记')
    expect((getByLabelText(root, '输入提示') as HTMLInputElement).value).toBe('beta-current')
  })
})

describe('Control Center preferences', () => {
  it('applies theme, density, and Launcher side to the Shadow host', async () => {
    const root = shadow()
    fireEvent.click(getByRole(root, 'button', { name: '打开 ExLG Next 控制中心' }))
    await waitFor(() => expect(getByRole(root, 'dialog')).toBeTruthy())
    fireEvent.click(getByRole(root, 'button', { name: '面板设置' }))
    fireEvent.change(await waitFor(() => getByLabelText(root, /主题/)), { target: { value: 'dark' } })
    await waitFor(() => expect(document.querySelector<HTMLElement>('#exlg-next-control-center-host')?.dataset.theme).toBe('dark'))
    fireEvent.change(getByLabelText(root, '信息密度'), { target: { value: 'compact' } })
    await waitFor(() => expect(document.querySelector<HTMLElement>('#exlg-next-control-center-host')?.dataset.density).toBe('compact'))
    fireEvent.change(getByLabelText(root, 'Launcher 位置'), { target: { value: 'left' } })
    await waitFor(() => expect(document.querySelector<HTMLElement>('#exlg-next-control-center-host')?.dataset.side).toBe('left'))
  })
})
