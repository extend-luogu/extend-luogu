import { defineFeature, setting } from '@exlg/runtime'
import type { LuoguFeatureContextExtension } from '@exlg/luogu'
import { chooseDistinctPages, chooseFilter, excludeKnownAccepted, parseProblemList, randomIndex } from './random'

const difficulties = ['0', '1', '2', '3', '4', '5', '6', '7', '8'] as const
const sources = ['P', 'CF', 'AT', 'SP', 'UVA'] as const
const idleButtonText = '随机 Ex'

export default defineFeature<{
  difficulties: ReturnType<typeof setting.multiSelect<typeof difficulties[number]>>
  sources: ReturnType<typeof setting.multiSelect<typeof sources[number]>>
  excludeAccepted: ReturnType<typeof setting.boolean>
}, LuoguFeatureContextExtension>({
  id: 'official.random-problem', apiVersion: 1,
  title: '增强随机题目', description: '按难度与来源筛选后随机跳转题目。',
  category: 'practice', defaultEnabled: false, matches: route => route.kind === 'home',
  capabilities: ['dom', 'navigation', 'network.luogu', 'luogu.page-data', 'ui'],
  settings: {
    difficulties: setting.multiSelect({ title: '难度', description: '每次从所选难度中随机抽取一个；“不限难度”兼容旧设置，当前题库接口不支持仅筛选暂无评定。', default: difficulties, options: difficulties.map(value => ({ value, label: ['不限难度', '入门', '普及−', '普及', '普及+/提高−', '提高', '提高+/省选−', '省选/NOI−', 'NOI/NOI+/CTS'][Number(value)] ?? value })) }),
    sources: setting.multiSelect({ title: '题目来源', description: '不勾选任何来源时使用洛谷主题库。', default: ['P'], options: sources.map(value => ({ value, label: ({ P: '洛谷', CF: 'Codeforces', AT: 'AtCoder', SP: 'SPOJ', UVA: 'UVA' } as const)[value] })) }),
    excludeAccepted: setting.boolean({ title: '排除已通过题目', default: true }),
  },
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    let pending = false
    const button = ctx.dom.create('button', {
      className: 'exlg-random-problem am-btn am-btn-success am-btn-sm',
      text: idleButtonText,
      attributes: { type: 'button', 'aria-label': '按 ExLG 设置筛选并随机跳题' },
    })
    ctx.dom.style('.exlg-random-problem{appearance:none;background:#3b8f65;border:0;border-radius:5px;color:#fff;cursor:pointer;font:600 13px system-ui;margin-inline-start:6px;padding:7px 11px}.exlg-random-problem:disabled{cursor:wait;opacity:.6}')
    const mountInJumpControls = (root: HTMLElement): void => {
      if (button.isConnected) return
      const nativeRandom = root.matches('button[name="gotorandom"]')
        ? root
        : root.querySelector<HTMLElement>('button[name="gotorandom"]')
      const target = nativeRandom?.parentElement
        ?? root.querySelector<HTMLElement>('[data-problem-jump-actions]')
        ?? (root.hasAttribute('data-problem-jump') ? root : null)
      if (target) ctx.dom.mount(target, button)
    }
    ctx.dom.observe<HTMLElement>('button[name="gotorandom"]', mountInJumpControls)
    ctx.dom.observe<HTMLElement>('[data-problem-jump], .lg-index-stat', root => {
      const heading = root.querySelector('h1,h2,h3')?.textContent ?? ''
      if (root.hasAttribute('data-problem-jump') || heading.includes('问题跳转')) {
        mountInJumpControls(root)
      }
    })
    const requestPage = async (query: Readonly<Record<string, string | number>>, page: number): Promise<unknown> => {
      const headerVariants: readonly Readonly<Record<string, string>>[] = [
        { 'x-lentille-request': 'content-only' },
        { 'x-luogu-type': 'content-only' },
      ]
      let lastError: unknown
      for (const headers of headerVariants) {
        if (ctx.signal.aborted) break
        try {
          const response = await ctx.network.request<unknown>('luogu', {
            path: '/problem/list', query: { ...query, page }, headers, responseType: 'json', signal: ctx.signal,
          })
          return response.data
        }
        catch (error) { lastError = error }
      }
      throw lastError instanceof Error ? lastError : new Error('problem list request failed')
    }
    ctx.dom.listen(button, 'click', () => {
      if (pending) return
      pending = true; button.disabled = true; button.textContent = '查找中…'; button.setAttribute('aria-busy', 'true')
      const filter = chooseFilter(values.difficulties, values.sources, Math.random)
      const query = { ...filter, _contentOnly: 1 }
      void Promise.all([
        requestPage(query, 1),
        values.excludeAccepted
          ? ctx.luogu.pageData.acceptedProblemIds({ signal: ctx.signal }).catch(() => null)
          : Promise.resolve(null),
      ]).then(async ([firstData, acceptedIds]) => {
        const first = parseProblemList(firstData)
        if (!first || first.count === 0) { ctx.ui.toast({ message: '没有符合条件的题目', tone: 'warning' }); return }
        const accepted = acceptedIds ? new Set(acceptedIds) : null
        const pageCount = Math.ceil(first.count / first.perPage)
        for (const page of chooseDistinctPages(pageCount, 4, Math.random)) {
          const data = page === 1 ? firstData : await requestPage(query, page)
          const parsed = parseProblemList(data)
          const candidates = parsed ? excludeKnownAccepted(parsed.pids, accepted) : []
          if (candidates.length > 0) {
            ctx.navigation.navigate(`/problem/${candidates[randomIndex(candidates.length, Math.random)]}`)
            return
          }
        }
        ctx.ui.toast({ message: '随机页面中没有未通过的候选题，请重试', tone: 'warning' })
      }).catch(() => { if (!ctx.signal.aborted) ctx.ui.toast({ message: '随机题目请求失败', tone: 'error' }) }).finally(() => {
        pending = false; button.disabled = false; button.textContent = idleButtonText; button.removeAttribute('aria-busy')
      })
    })
  },
})
