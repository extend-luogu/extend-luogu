import type { LuoguFeatureContextExtension, LuoguProblemDetails } from '@exlg/luogu'
import { defineFeature, setting } from '@exlg/runtime'
import { applyProblemTemplate, createCphPayload } from './payload'

const settings = {
  autoHideWhenUnavailable: setting.boolean({ title: 'CPH 未运行时隐藏按钮', default: true }),
  problemNameTemplate: setting.string({ title: '单题名称模板', description: '支持 ${pid}、${title}', default: 'Luogu_${pid}' }),
  contestNameTemplate: setting.string({ title: '比赛题目名称模板', description: '支持 ${cid}、${pid}、${title}', default: 'Luogu_${cid}_${pid}' }),
  localhostHost: setting.select({ title: '本地接收地址', default: 'localhost', options: [{ value: 'localhost', label: 'localhost' }, { value: '127.0.0.1', label: '127.0.0.1' }] }),
  contestConcurrency: setting.number({ title: '比赛导入并发数', default: 2, min: 1, max: 4, step: 1, integer: true }),
} as const

export default defineFeature<typeof settings, LuoguFeatureContextExtension>({
  id: 'official.import-to-cph', apiVersion: 1,
  title: '导入到 CPH', description: '将验证后的题目样例发送到本机 Competitive Companion 接收端。',
  category: 'practice', defaultEnabled: false,
  matches: route => route.kind === 'problem' || route.kind === 'contest',
  capabilities: ['dom', 'ui', 'network.localhost', 'luogu.page-data'], settings,
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    const target = values.localhostHost === 'localhost' ? 'cph-localhost' : 'cph-loopback'
    const button = ctx.dom.create('button', { className: 'exlg-cph-import', text: ctx.route.kind === 'contest' ? '导入比赛到 CPH' : '导入到 CPH', attributes: { type: 'button' } })
    ctx.dom.style('.exlg-cph-import{appearance:none;background:#327ebd;border:0;border-radius:5px;color:#fff;cursor:pointer;font:600 13px system-ui;padding:7px 11px}.exlg-cph-import:disabled{cursor:wait;opacity:.6}')
    ctx.dom.observe<HTMLElement>('[data-problem-actions], [data-contest-actions], .btn-actions, .operation, main', element => { if (!button.isConnected) ctx.dom.mount(element, button) })
    const send = async (problem: LuoguProblemDetails, cid: string | undefined, batchSize: number): Promise<boolean> => {
      const template = cid ? values.contestNameTemplate : values.problemNameTemplate
      const name = applyProblemTemplate(template, { pid: problem.pid, ...(cid ? { cid } : {}), ...(problem.title ? { title: problem.title } : {}) })
      const payload = createCphPayload(problem, { origin: ctx.route.url.origin, name, batchId: cid ? `exlg-contest-${cid}` : `exlg-problem-${problem.pid}`, batchSize })
      try {
        await ctx.network.request(target, { path: '/', method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' }, responseType: 'text', timeoutMs: 4_000, signal: ctx.signal })
        return true
      } catch { return false }
    }
    ctx.dom.listen(button, 'click', () => {
      if (button.disabled) return
      button.disabled = true; button.textContent = '传输中…'
      void (async () => {
        if (ctx.route.kind === 'problem') {
          const problem = await ctx.luogu.pageData.currentProblem({ signal: ctx.signal })
          const ok = problem ? await send(problem, ctx.route.url.searchParams.get('contestId') ?? undefined, 1) : false
          if (!ok && values.autoHideWhenUnavailable) button.remove()
          ctx.ui.toast({ message: ok ? '已发送到 CPH' : 'CPH 未运行或题目数据不可用', tone: ok ? 'success' : 'error' })
          return
        }
        const contest = await ctx.luogu.pageData.currentContest({ signal: ctx.signal })
        if (!contest || contest.problems.length === 0) { ctx.ui.toast({ message: '比赛题目暂不可用', tone: 'warning' }); return }
        let cursor = 0; let succeeded = 0
        const worker = async (): Promise<void> => {
          while (!ctx.signal.aborted) {
            const summary = contest.problems[cursor++]
            if (!summary) return
            const problem = await ctx.luogu.pageData.problem(summary.pid, { signal: ctx.signal }).catch(() => null)
            if (problem && await send(problem, contest.contestId, contest.problems.length)) succeeded += 1
          }
        }
        await Promise.all(Array.from({ length: Math.min(values.contestConcurrency, contest.problems.length) }, worker))
        if (succeeded === 0 && values.autoHideWhenUnavailable) button.remove()
        ctx.ui.toast({ message: `CPH 导入完成：${succeeded}/${contest.problems.length}`, tone: succeeded === contest.problems.length ? 'success' : 'warning' })
      })().catch(() => ctx.ui.toast({ message: 'CPH 导入失败', tone: 'error' })).finally(() => {
        button.disabled = false; button.textContent = ctx.route.kind === 'contest' ? '导入比赛到 CPH' : '导入到 CPH'
      })
    })
  },
})
