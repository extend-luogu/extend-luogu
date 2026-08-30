import type { LuoguFeatureContextExtension } from '@exlg/luogu'
import type { JsonValue } from '@exlg/runtime'
import { defineFeature, setting } from '@exlg/runtime'
import { atCoderDifficultyMap, codeforcesRating, parseCodeforcesPid } from './difficulty'

interface AtCoderCache extends Record<string, JsonValue> { readonly version: 1; readonly fetchedAt: number; readonly values: Readonly<Record<string, number>> }

const settings = {
  providers: setting.multiSelect({ title: '数据源', default: ['codeforces', 'atcoder'], options: [{ value: 'codeforces', label: 'Codeforces' }, { value: 'atcoder', label: 'AtCoder Problems' }] }),
  cacheHours: setting.number({ title: 'AtCoder 缓存时间（小时）', default: 24, min: 1, max: 168, step: 1, integer: true }),
  showSourceLabel: setting.boolean({ title: '显示数据源', default: true }),
} as const

export default defineFeature<typeof settings, LuoguFeatureContextExtension>({
  id: 'official.original-difficulty', apiVersion: 1,
  title: '原始题目难度', description: '显示 Codeforces 或 AtCoder 的原始难度。',
  category: 'problem', defaultEnabled: false, matches: route => route.kind === 'problem',
  capabilities: ['dom', 'storage', 'network.codeforces', 'network.atcoder', 'luogu.page-data'], settings,
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    const problem = await ctx.luogu.pageData.currentProblem({ signal: ctx.signal }).catch(() => null)
    if (!problem || !problem.source || ctx.signal.aborted) return
    const field = ctx.dom.create('div', { className: 'exlg-original-difficulty', text: '原始难度：获取中' })
    ctx.dom.style('.exlg-original-difficulty{align-items:center;color:#475569;display:flex;font:500 13px system-ui,sans-serif;gap:5px;margin:6px 0}.exlg-original-difficulty strong{color:#1f2937}')
    ctx.dom.observe<HTMLElement>('[data-problem-stats], .problem-stat, .stat, main', target => { if (!field.isConnected) ctx.dom.mount(target, field) })
    let rating: number | null = null
    let provider = ''
    try {
      if (problem.source.type === 'codeforces' && values.providers.includes('codeforces')) {
        const parsed = parseCodeforcesPid(problem.pid)
        if (parsed) {
          provider = 'Codeforces'
          const response = await ctx.network.request<unknown>('codeforces', { path: '/api/contest.standings', query: { contestId: parsed.contestId, from: 1, count: 1 }, responseType: 'json', signal: ctx.signal })
          rating = codeforcesRating(response.data, parsed.index)
        }
      } else if (problem.source.type === 'atcoder' && values.providers.includes('atcoder')) {
        provider = 'AtCoder'
        const cached = await ctx.storage.get<AtCoderCache>('atcoder-cache')
        const fresh = cached?.version === 1 && Date.now() - cached.fetchedAt <= values.cacheHours * 3_600_000
        let map = fresh ? cached.values : null
        if (!map) {
          const response = await ctx.network.request<unknown>('atcoder-problems', { path: '/atcoder/resources/problem-models.json', responseType: 'json', signal: ctx.signal, timeoutMs: 20_000 })
          map = atCoderDifficultyMap(response.data)
          if (map) await ctx.storage.set('atcoder-cache', { version: 1, fetchedAt: Date.now(), values: map })
        }
        const remoteId = problem.source.remoteId?.toLowerCase()
        rating = remoteId && map?.[remoteId] !== undefined ? map[remoteId] : null
      }
    } catch { rating = null }
    if (!ctx.signal.aborted) field.textContent = `原始难度：${rating ?? '不可用'}${values.showSourceLabel && provider ? ` · ${provider}` : ''}`
  },
})
