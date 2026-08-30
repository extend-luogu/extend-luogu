import { defineFeature, setting } from '@exlg/runtime'
import type { LuoguFeatureContextExtension } from '@exlg/luogu'
import { chooseFilter, excludeKnownAccepted, parseProblemList, randomIndex } from './random'

const difficulties = ['0', '1', '2', '3', '4', '5', '6', '7', '8'] as const
const sources = ['P', 'CF', 'AT', 'SP', 'UVA'] as const

export default defineFeature<{
  difficulties: ReturnType<typeof setting.multiSelect<typeof difficulties[number]>>
  sources: ReturnType<typeof setting.multiSelect<typeof sources[number]>>
  excludeAccepted: ReturnType<typeof setting.boolean>
}, LuoguFeatureContextExtension>({
  id: 'official.random-problem', apiVersion: 1,
  title: '增强随机题目', description: '按难度与来源筛选后随机跳转题目。',
  category: 'practice', defaultEnabled: false, matches: route => route.kind === 'home',
  capabilities: ['dom', 'navigation', 'network.luogu', 'ui'],
  settings: {
    difficulties: setting.multiSelect({ title: '难度', description: '每次从所选难度中随机抽取一个；当前接口将“暂无评定”视为不限难度。', default: difficulties, options: difficulties.map(value => ({ value, label: ['暂无评定 / 不限', '入门', '普及−', '普及', '普及+/提高−', '提高', '提高+/省选−', '省选/NOI−', 'NOI/NOI+/CTS'][Number(value)] ?? value })) }),
    sources: setting.multiSelect({ title: '题目来源', default: ['P'], options: sources.map(value => ({ value, label: ({ P: '洛谷', CF: 'Codeforces', AT: 'AtCoder', SP: 'SPOJ', UVA: 'UVA' } as const)[value] })) }),
    excludeAccepted: setting.boolean({ title: '排除已通过题目', default: true }),
  },
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    let pending = false
    const button = ctx.dom.create('button', { className: 'exlg-random-problem', text: '随机题目', attributes: { type: 'button' } })
    ctx.dom.style('.exlg-random-problem{appearance:none;background:#4f68b2;border:0;border-radius:5px;color:#fff;cursor:pointer;font:600 13px system-ui;padding:7px 11px}.exlg-random-problem:disabled{cursor:wait;opacity:.6}')
    ctx.dom.observe<HTMLElement>('[data-problem-jump], .lg-index-stat, body', target => { if (!button.isConnected) ctx.dom.mount(target, button) })
    ctx.dom.listen(button, 'click', () => {
      if (pending) return
      pending = true; button.disabled = true; button.textContent = '查找中…'
      const filter = chooseFilter(values.difficulties, values.sources, Math.random)
      const query = { ...filter, page: 1, _contentOnly: 1 }
      void Promise.all([
        ctx.network.request<unknown>('luogu', { path: '/problem/list', query, headers: { 'x-lentille-request': 'content-only' }, responseType: 'json', signal: ctx.signal }),
        values.excludeAccepted
          ? ctx.luogu.pageData.acceptedProblemIds({ signal: ctx.signal }).catch(() => null)
          : Promise.resolve(null),
      ]).then(async ([firstResponse, acceptedIds]) => {
        const first = parseProblemList(firstResponse.data)
        if (!first || first.count === 0) { ctx.ui.toast({ message: '没有符合条件的题目', tone: 'warning' }); return }
        const accepted = acceptedIds ? new Set(acceptedIds) : null
        const pageCount = Math.ceil(first.count / first.perPage)
        for (let attempt = 0; attempt < Math.min(pageCount, 4); attempt += 1) {
          const page = randomIndex(pageCount, Math.random) + 1
          const response = page === 1 && attempt === 0 ? firstResponse : await ctx.network.request<unknown>('luogu', {
            path: '/problem/list', query: { ...query, page }, headers: { 'x-lentille-request': 'content-only' }, responseType: 'json', signal: ctx.signal,
          })
          const parsed = parseProblemList(response.data)
          const candidates = parsed ? excludeKnownAccepted(parsed.pids, accepted) : []
          if (candidates.length > 0) {
            ctx.navigation.navigate(`/problem/${candidates[randomIndex(candidates.length, Math.random)]}`)
            return
          }
        }
        ctx.ui.toast({ message: '随机页面中没有未通过的候选题，请重试', tone: 'warning' })
      }).catch(() => { if (!ctx.signal.aborted) ctx.ui.toast({ message: '随机题目请求失败', tone: 'error' }) }).finally(() => {
        pending = false; button.disabled = false; button.textContent = '随机题目'
      })
    })
  },
})
