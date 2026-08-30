import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LuoguEditorSession, LuoguFeatureContextExtension, LuoguPageDataService } from '@exlg/luogu'
import type { Cleanup, FeatureDefinition, JsonValue, NetworkRequest, NetworkService, NetworkTarget, RouteSnapshot, SettingsSchema } from '@exlg/runtime'
import { createScope } from '@exlg/runtime'
import autoO2 from '../../../features/auto-o2'
import backToContest from '../../../features/back-to-contest'
import codeBlockCopy from '../../../features/code-block-copy'
import editorEmoticons from '../../../features/editor-emoticons'
import editorFormatting from '../../../features/editor-formatting'
import editorShortcuts from '../../../features/editor-shortcuts'
import homeDiscussionDensity from '../../../features/home-discussion-density'
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

const unavailableNetwork: NetworkService = { async request<T>(): Promise<never> { throw new Error('unused') } }

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
  it('enhances initial and dynamic code blocks and fully cleans them', async () => {
    vi.useFakeTimers()
    const mounted = await mountFeature(codeBlockCopy, { html: '<body><pre><code class="language-ts">let x=1</code></pre></body>', url: 'https://www.luogu.com.cn/problem/P1' })
    expect(mounted.dom.window.document.querySelector('.exlg-code-header')).not.toBeNull()
    mounted.dom.window.document.querySelector<HTMLButtonElement>('.exlg-code-copy')?.click()
    await Promise.resolve()
    expect(mounted.clipboard).toHaveBeenCalledWith('let x=1')
    const pre = mounted.dom.window.document.createElement('pre'); pre.innerHTML = '<code>dynamic</code>'; mounted.dom.window.document.body.append(pre)
    await Promise.resolve()
    expect(mounted.dom.window.document.querySelectorAll('.exlg-code-copy')).toHaveLength(2)
    await mounted.scope.dispose()
    expect(mounted.dom.window.document.querySelector('.exlg-code-copy')).toBeNull()
    expect(pre.dataset.exlgCodeBlock).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
  })

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

  it('mounts a contest return action only with a valid contest id', async () => {
    const mounted = await mountFeature(backToContest, { html: '<body><div class="btn-actions"></div></body>', url: 'https://www.luogu.com.cn/problem/P1?contestId=42' })
    expect(mounted.dom.window.document.querySelector<HTMLAnchorElement>('.exlg-back-to-contest')?.getAttribute('href')).toBe('/contest/42#problems')
    await mounted.scope.dispose()
    expect(mounted.dom.window.document.querySelector('.exlg-back-to-contest')).toBeNull()
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

  it('recognizes the current O2 label without relying on its generated id', async () => {
    const mounted = await mountFeature(autoO2, { html: '<body><div class="lang-select"><div class="text">C++17</div></div><label>启用 O2 优化<input id="LCheck-4" type="checkbox"></label><button>提交评测</button></body>', url: 'https://www.luogu.com.cn/problem/P1', settings: { mode: 'always' } })
    expect(mounted.dom.window.document.querySelector<HTMLInputElement>('input')?.checked).toBe(true)
    await mounted.scope.dispose()
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
  it('handles a shortcut only through the editor adapter', async () => {
    let keydown: ((event: KeyboardEvent) => void) | undefined
    const replace = vi.fn(async () => undefined)
    const editor: LuoguEditorSession = {
      kind: 'discussion', async getValue() { return '' }, async setValue() { /* unused */ },
      async getSelection() { return 'text' }, async getSelectionRange() { return { start: 0, end: 4 } },
      async insertText() { /* unused */ }, replaceSelection: replace, async replaceRange() { /* unused */ }, async focus() { /* unused */ },
      listenKeydown(listener) { keydown = listener; return () => { keydown = undefined } },
      mountToolbarButton() { return () => undefined },
    }
    const mounted = await mountFeature(editorShortcuts, { html: '<body></body>', url: 'https://www.luogu.com.cn/discuss/1', editor })
    const event = new mounted.dom.window.KeyboardEvent('keydown', { key: 'b', ctrlKey: true, cancelable: true })
    keydown?.(event)
    await Promise.resolve()
    expect(replace).toHaveBeenCalledWith('**text**')
    expect(event.defaultPrevented).toBe(true)
    await mounted.scope.dispose()
    expect(keydown).toBeUndefined()
  })

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

  it('requests a validated random page and excludes known accepted PIDs', async () => {
    const requests: NetworkRequest[] = []
    const network: NetworkService = { async request<T>(_target: NetworkTarget, request: NetworkRequest) {
      requests.push(request)
      return { status: 200, ok: true, data: {
        status: 200, data: { problems: { count: 2, perPage: 50, result: [{ pid: 'P1' }, { pid: 'P2' }] } },
      } as T }
    } }
    const mounted = await mountFeature(randomProblem, {
      html: '<body><div class="lg-index-stat"></div></body>', url: 'https://www.luogu.com.cn/',
      network, pageData: { async acceptedProblemIds() { return ['P1'] } },
    })
    mounted.dom.window.document.querySelector<HTMLButtonElement>('.exlg-random-problem')?.click()
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
    expect(mounted.navigate).toHaveBeenCalledWith('/problem/P2')
    expect(requests[0]).toMatchObject({ path: '/problem/list' })
    await mounted.scope.dispose()
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
