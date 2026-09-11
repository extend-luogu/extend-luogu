import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LuoguEditorSession, LuoguPageDataService } from '@exlg/luogu'
import type { Cleanup, FeatureDefinition, JsonValue, NetworkRequest, NetworkService, NetworkTarget, RouteSnapshot, SettingsSchema } from '@exlg/runtime'
import { createScope } from '@exlg/runtime'
import editorEmoticons from '../../../features/editor-emoticons'
import editorFormatting from '../../../features/editor-formatting'
import homeDiscussionDensity from '../../../features/home-discussion-density'
import homeJumpSwitcher from '../../../features/home-jump-switcher'
import importToCph from '../../../features/import-to-cph'
import originalDifficulty from '../../../features/original-difficulty'
import quickNavigation from '../../../features/quick-navigation'
import randomProblem from '../../../features/random-problem'
import recordDifficultyColors from '../../../features/record-difficulty-colors'
import solutionSpoilerGuard from '../../../features/solution-spoiler-guard'
import tasklistEnhancer from '../../../features/tasklist-enhancer'
import trainingRandomizer, { trainingCandidates } from '../../../features/training-randomizer'
import userIntroduction from '../../../features/user-introduction'
import userNotes from '../../../features/user-notes'
import { BrowserFeatureServices, createDomEnvironment, FeatureConfigurationController, type JsonKeyValueStore } from '../src'

class MemoryStore implements JsonKeyValueStore {
  readonly values = new Map<string, unknown>()
  async get(key: string): Promise<unknown> { return this.values.get(key) }
  async set(key: string, value: JsonValue): Promise<void> { this.values.set(key, value) }
  async delete(key: string): Promise<void> { this.values.delete(key) }
}

const unavailableNetwork: NetworkService = { async request(): Promise<never> { throw new Error('unused') } }

function pageData(overrides: Partial<LuoguPageDataService> = {}): LuoguPageDataService {
  return {
    async currentProblem() { return null }, async problem() { return null },
    async currentContest() { return null }, async contest() { return null },
    async currentTraining() { return null }, async training() { return null },
    async visibleRecords() { return [] }, async acceptedProblemIds() { return null },
    currentUserId() { return null }, ...overrides,
  }
}

async function mountFeature<Schema extends SettingsSchema, Extension extends object>(
  feature: FeatureDefinition<Schema, Extension>,
  options: {
    readonly html: string
    readonly url: string
    readonly settings?: Readonly<Record<string, string | boolean | number | readonly string[]>>
    readonly pageData?: Partial<LuoguPageDataService>
    readonly editor?: LuoguEditorSession | null
    readonly storedData?: Readonly<Record<string, JsonValue>>
    readonly confirm?: boolean
    readonly network?: NetworkService
  },
) {
  const dom = new JSDOM(options.html, { url: options.url })
  Object.assign(globalThis, {
    Element: dom.window.Element, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver, Event: dom.window.Event,
  })
  const store = new MemoryStore()
  if (options.storedData) store.values.set(`exlg:vnext:data:${feature.id}`, { schemaVersion: 1, values: options.storedData })
  const configuration = new FeatureConfigurationController(store)
  if (options.settings) await configuration.setMany(feature, options.settings)
  const navigate = vi.fn()
  const clipboard = vi.fn(async () => undefined)
  const scope = createScope()
  const services = new BrowserFeatureServices({
    store, configuration, clipboard: { writeText: clipboard }, network: options.network ?? unavailableNetwork,
    navigation: { navigate, open: navigate }, dom: createDomEnvironment(dom.window.document),
  })
  const pathname = new URL(options.url).pathname
  const route: RouteSnapshot = {
    kind: pathname.startsWith('/user/') ? 'user'
      : pathname.startsWith('/record/') ? 'record'
        : pathname.startsWith('/problem/') ? 'problem'
          : pathname.startsWith('/training/') ? 'training'
            : pathname.startsWith('/contest/') ? 'contest'
              : pathname.startsWith('/discuss/') ? 'discussion'
                : pathname.startsWith('/blog') ? 'blog' : 'home',
    key: new URL(options.url).pathname + new URL(options.url).search,
    url: new URL(options.url),
    params: options.url.includes('/user/') ? { userId: new URL(options.url).pathname.split('/')[2] ?? '' } : {},
  }
  const session = options.editor ?? null
  const context = {
    ...services.mount(feature, scope, route),
    ui: {
      toast: vi.fn(),
      confirm: vi.fn(async () => options.confirm ?? true),
      prompt: vi.fn(async () => null),
    },
    luogu: {
      pageData: pageData(options.pageData),
      editor: { async waitForEditor() { return session } },
      privateMessages: { async subscribe(): Promise<Cleanup> { return () => undefined } },
    },
  }
  const cleanup = await feature.mount?.(context as never)
  if (cleanup) scope.add(cleanup)
  await Promise.resolve()
  return { dom, scope, navigate, clipboard, store, context }
}

beforeEach(() => { vi.useRealTimers() })

describe('migrated DOM Features', () => {
  it('restores a hidden user introduction', async () => {
    const mounted = await mountFeature(userIntroduction, { html: '<body><div class="introduction marked" hidden>intro</div></body>', url: 'https://www.luogu.com.cn/user/1' })
    const introduction = mounted.dom.window.document.querySelector<HTMLElement>('.introduction')!
    expect(introduction.hidden).toBe(false)
    await mounted.scope.dispose()
    expect(introduction.hidden).toBe(true)
  })

  it('confirms a solution reveal without permanently changing the link', async () => {
    const mounted = await mountFeature(solutionSpoilerGuard, { html: '<body><a href="/problem/solution/P1">查看题解</a></body>', url: 'https://www.luogu.com.cn/problem/P1', confirm: true })
    mounted.dom.window.document.querySelector<HTMLAnchorElement>('a')?.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mounted.navigate).toHaveBeenCalledWith('/problem/solution/P1')
    await mounted.scope.dispose()
  })

  it('maps record difficulty by PID and restores the link', async () => {
    const mounted = await mountFeature(recordDifficultyColors, { html: '<body><a href="/problem/P1">P1</a></body>', url: 'https://www.luogu.com.cn/record/list', pageData: { async visibleRecords() { return [{ pid: 'P1', difficulty: 4 }] } } })
    const link = mounted.dom.window.document.querySelector<HTMLAnchorElement>('a')!
    expect(link.title).toContain('难度')
    expect(mounted.dom.window.document.querySelector('.exlg-record-difficulty-label')).not.toBeNull()
    await mounted.scope.dispose()
    expect(link.getAttribute('title')).toBeNull()
  })

  it('limits discussions, handles dynamic items and restores hidden state', async () => {
    const panels = Array.from({ length: 14 }, (_, index) => `<section class="am-panel">${index}</section>`).join('')
    const mounted = await mountFeature(homeDiscussionDensity, { html: `<body><div class="lg-article"><h2>讨论</h2>${panels}</div></body>`, url: 'https://www.luogu.com.cn/' })
    const items = mounted.dom.window.document.querySelectorAll<HTMLElement>('.am-panel')
    expect(items[12]?.hidden).toBe(true)
    const dynamic = mounted.dom.window.document.createElement('section'); dynamic.className = 'am-panel'; mounted.dom.window.document.querySelector('.lg-article')?.append(dynamic)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(dynamic.hidden).toBe(true)
    await mounted.scope.dispose()
    expect(items[12]?.hidden).toBe(false)
  })

  it('enhances the current tasklist structure and restores tasks', async () => {
    const mounted = await mountFeature(tasklistEnhancer, { html: '<body><div class="lg-article"><h2>任务计划</h2><div class="tasklist-item"><a><span class="lg-fg-green"></span></a><a href="/problem/P1">P1</a></div><div class="tasklist-item"><a href="/problem/P2">P2</a></div></div></body>', url: 'https://www.luogu.com.cn/' })
    const accepted = mounted.dom.window.document.querySelector<HTMLElement>('.tasklist-item')!
    expect(accepted.hidden).toBe(true)
    expect(mounted.dom.window.document.querySelector('.exlg-task-actions')).not.toBeNull()
    await mounted.scope.dispose()
    expect(accepted.hidden).toBe(false)
  })

  it('applies and restores user notes on dynamically discovered links', async () => {
    const mounted = await mountFeature(userNotes, { html: '<body><a href="/user/12">Alice</a></body>', url: 'https://www.luogu.com.cn/problem/P1', storedData: { 'notes-v1': { version: 1, notes: { '12': { text: '队友', updatedAt: 1 } } } } })
    expect(mounted.dom.window.document.querySelector('.exlg-user-note')?.textContent).toBe('队友')
    await mounted.scope.dispose()
    expect(mounted.dom.window.document.querySelector('a')?.textContent).toBe('Alice')
  })
})

describe('migrated editor and candidate behavior', () => {
  it('filters training candidates by status', () => {
    const problem = (status: 'new' | 'attempted' | 'accepted' | 'unknown') => ({ problem: { pid: status }, status })
    const values = [problem('new'), problem('attempted'), problem('accepted'), problem('unknown')]
    expect(trainingCandidates(values, 'new-only').map(item => item.status)).toEqual(['new'])
    expect(trainingCandidates(values, 'new-and-unaccepted').map(item => item.status)).toEqual(['new', 'attempted', 'unknown'])
  })

  it('mounts local emoticons and formatting through editor adapter actions', async () => {
    const actions = new Map<string, () => void>()
    const insert = vi.fn(async () => undefined)
    const setValue = vi.fn(async () => undefined)
    const editor: LuoguEditorSession = {
      kind: 'discussion', async getValue() { return '中文ABC' }, setValue,
      async getSelection() { return '' }, async getSelectionRange() { return { start: 0, end: 0 } },
      insertText: insert, async replaceSelection() { /* unused */ }, async replaceRange() { /* unused */ }, async focus() { /* unused */ },
      listenKeydown() { return () => undefined },
      mountToolbarButton(options) { actions.set(options.id, options.onClick); return () => { actions.delete(options.id) } },
    }
    const emoticons = await mountFeature(editorEmoticons, { html: '<body></body>', url: 'https://www.luogu.com.cn/discuss/1', editor })
    actions.get('emoticons')?.()
    const emoticonRoot = emoticons.dom.window.document.querySelector<HTMLElement>('.exlg-emoticon-host')?.shadowRoot
    emoticonRoot?.querySelector<HTMLButtonElement>('[data-emoticon="smile"]')?.click()
    await Promise.resolve()
    expect(insert).toHaveBeenCalledWith('（・∀・）')
    await emoticons.scope.dispose()
    expect(emoticonRoot?.host.isConnected).toBe(false)

    const formatting = await mountFeature(editorFormatting, { html: '<body></body>', url: 'https://www.luogu.com.cn/discuss/1', editor })
    actions.get('local-formatting')?.()
    await Promise.resolve(); await Promise.resolve()
    expect(setValue).toHaveBeenCalledWith('中文 ABC')
    await formatting.scope.dispose()
  })

  it('opens the scoped command palette and navigates a parsed problem ID', async () => {
    const mounted = await mountFeature(quickNavigation, { html: '<body><main></main></body>', url: 'https://www.luogu.com.cn/' })
    mounted.dom.window.document.body.dispatchEvent(new mounted.dom.window.KeyboardEvent('keydown', { key: 'k', altKey: true, bubbles: true, cancelable: true }))
    const root = mounted.dom.window.document.querySelector<HTMLElement>('.exlg-palette-host')?.shadowRoot
    const input = root?.querySelector<HTMLInputElement>('input')
    expect(input).toBeTruthy()
    if (input) {
      input.value = 'P1000'
      input.dispatchEvent(new mounted.dom.window.Event('input', { bubbles: true }))
      input.dispatchEvent(new mounted.dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    }
    await Promise.resolve()
    expect(mounted.navigate).toHaveBeenCalledWith('/problem/P1000')
    await mounted.scope.dispose()
    expect(root?.host.isConnected).toBe(false)
  })

  it('switches the home jump card between problem and user navigation without removing native controls', async () => {
    const requests: NetworkRequest[] = []
    const network: NetworkService = { async request<T>(_target: NetworkTarget, request: NetworkRequest) {
      requests.push(request)
      return { status: 200, ok: true, data: {
        users: [{ uid: 8457, name: 'chen_zhe' }],
      } as T }
    } }
    const mounted = await mountFeature(homeJumpSwitcher, {
      html: '<body><div class="lg-article lg-index-stat"><h2>问题跳转</h2><div class="am-input-group"><input name="toproblem"></div><p><button name="goto">跳转</button><button name="gotorandom">随机跳题</button></p></div></body>',
      url: 'https://www.luogu.com.cn/', network,
    })
    const card = mounted.dom.window.document.querySelector<HTMLElement>('.lg-index-stat')!
    const heading = card.querySelector<HTMLHeadingElement>('h2')!
    const nativeInput = card.querySelector<HTMLInputElement>('input[name="toproblem"]')!
    const nativeActions = card.querySelector<HTMLParagraphElement>('p')!
    const toggle = card.querySelector<HTMLButtonElement>('.exlg-home-jump-toggle')!
    const panel = card.querySelector<HTMLElement>('.exlg-home-jump-panel')!
    const userInput = panel.querySelector<HTMLInputElement>('input')!
    const submit = panel.querySelector<HTMLButtonElement>('.exlg-home-user-submit')!

    expect(panel.hidden).toBe(true)
    expect(nativeInput.parentElement?.hidden).toBe(false)
    toggle.click()
    expect(heading.firstChild?.textContent?.trim()).toBe('查询用户')
    expect(nativeInput.parentElement?.hidden).toBe(true)
    expect(nativeActions.hidden).toBe(true)
    expect(nativeInput.isConnected).toBe(true)
    expect(nativeActions.isConnected).toBe(true)
    expect(panel.hidden).toBe(false)

    userInput.value = '123'
    submit.click()
    expect(mounted.navigate).toHaveBeenCalledWith('/user/123')
    expect(requests).toHaveLength(0)

    mounted.navigate.mockClear()
    userInput.value = 'chen_zhe'
    userInput.dispatchEvent(new mounted.dom.window.KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true,
    }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      path: '/api/user/search', query: { keyword: 'chen_zhe' }, responseType: 'json',
    })
    expect(mounted.navigate).toHaveBeenCalledWith('/user/8457')

    toggle.click()
    expect(heading.firstChild?.textContent?.trim()).toBe('问题跳转')
    expect(nativeInput.parentElement?.hidden).toBe(false)
    expect(nativeActions.hidden).toBe(false)
    expect(panel.hidden).toBe(true)
    await mounted.scope.dispose()
    expect(nativeInput.isConnected).toBe(true)
    expect(nativeActions.isConnected).toBe(true)
    expect(toggle.isConnected).toBe(false)
    expect(card.hasAttribute('data-problem-jump')).toBe(false)
  })

  it('requests a validated random page and excludes known accepted PIDs', async () => {
    const requests: NetworkRequest[] = []
    const network: NetworkService = { async request<T>(_target: NetworkTarget, request: NetworkRequest) {
      requests.push(request)
      return { status: 200, ok: true, data: {
        status: 200, data: { problems: { count: 2, perPage: 50, result: [{ pid: 'P1' }, { pid: 'P2' }] } },
      } as T }
    } }
    const mounted = await mountFeature(randomProblem, {
      html: '<body><div class="lg-index-stat"><h2>问题跳转</h2><div><input name="toproblem"></div><p><button name="goto">跳转</button><button name="gotorandom">随机跳题</button></p></div><div class="lg-index-stat"><h2>其他卡片</h2></div></body>',
      url: 'https://www.luogu.com.cn/', settings: { difficulties: ['1'], sources: ['P'], excludeAccepted: true },
      network, pageData: { async acceptedProblemIds() { return ['P1'] } },
    })
    const button = mounted.dom.window.document.querySelector<HTMLButtonElement>('.exlg-random-problem')
    const nativeRandom = mounted.dom.window.document.querySelector<HTMLButtonElement>('button[name="gotorandom"]')
    expect(button?.parentElement).toBe(nativeRandom?.parentElement)
    expect(button?.parentElement).not.toBe(mounted.dom.window.document.body)
    button?.click()
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
    expect(mounted.navigate).toHaveBeenCalledWith('/problem/P2')
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      path: '/problem/list', query: { difficulty: 1, type: 'P', _contentOnly: 1, page: 1 },
      headers: { 'x-lentille-request': 'content-only' },
    })
    await mounted.scope.dispose()
    expect(nativeRandom?.isConnected).toBe(true)
    expect(button?.isConnected).toBe(false)
  })

  it('jumps to a filtered training candidate through NavigationService', async () => {
    const mounted = await mountFeature(trainingRandomizer, {
      html: '<body><div class="btn-actions"></div></body>', url: 'https://www.luogu.com.cn/training/9',
      pageData: { async currentTraining() { return { trainingId: '9', problems: [{ problem: { pid: 'P2' }, status: 'attempted' }] } } },
    })
    mounted.dom.window.document.querySelector<HTMLButtonElement>('.exlg-training-random')?.click()
    expect(mounted.navigate).toHaveBeenCalledWith('/problem/P2')
    await mounted.scope.dispose()
  })

  it('renders original difficulty from a validated provider response', async () => {
    const mounted = await mountFeature(originalDifficulty, {
      html: '<body><div class="stat"></div></body>', url: 'https://www.luogu.com.cn/problem/CF1A',
      pageData: { async currentProblem() { return { pid: 'CF1A', source: { type: 'codeforces', remoteId: '1A' } } } },
      network: { async request<T>() { return { status: 200, ok: true, data: { status: 'OK', result: { problems: [{ index: 'A', rating: 800 }] } } as T } } },
    })
    expect(mounted.dom.window.document.querySelector('.exlg-original-difficulty')?.textContent).toContain('800')
    await mounted.scope.dispose()
  })

  it('sends only a validated CPH payload on explicit click', async () => {
    const requests: NetworkRequest[] = []
    const network: NetworkService = { async request<T>(_target: NetworkTarget, request: NetworkRequest) {
      requests.push(request)
      return { status: 200, ok: true, data: 'ok' as T }
    } }
    const mounted = await mountFeature(importToCph, {
      html: '<body><div class="btn-actions"></div></body>', url: 'https://www.luogu.com.cn/problem/P1',
      pageData: { async currentProblem() { return { pid: 'P1', title: 'A', samples: [{ input: '1', output: '2' }], source: { type: 'luogu' } } } },
      network,
    })
    expect(requests).toHaveLength(0)
    mounted.dom.window.document.querySelector<HTMLButtonElement>('.exlg-cph-import')?.click()
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
    const body = requests[0]?.body
    expect(JSON.parse(String(body))).toMatchObject({ name: 'Luogu_P1', tests: [{ input: '1', output: '2' }] })
    await mounted.scope.dispose()
  })
})
