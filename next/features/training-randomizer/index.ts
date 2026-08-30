import type { LuoguFeatureContextExtension, LuoguTrainingProblem } from '@exlg/luogu'
import { defineFeature, setting } from '@exlg/runtime'

export function trainingCandidates(problems: readonly LuoguTrainingProblem[], mode: 'new-only' | 'unaccepted-only' | 'new-and-unaccepted' | 'all'): readonly LuoguTrainingProblem[] {
  if (mode === 'all') return problems
  if (mode === 'new-only') return problems.filter(item => item.status === 'new')
  if (mode === 'unaccepted-only') return problems.filter(item => item.status === 'attempted')
  return problems.filter(item => item.status === 'new' || item.status === 'attempted' || item.status === 'unknown')
}

export default defineFeature<{
  mode: ReturnType<typeof setting.select<'new-only' | 'unaccepted-only' | 'new-and-unaccepted' | 'all'>>
}, LuoguFeatureContextExtension>({
  id: 'official.training-randomizer', apiVersion: 1,
  title: '题单随机跳题', description: '从当前题单按完成状态随机选择一道题。',
  category: 'contest', defaultEnabled: false, matches: route => route.kind === 'training',
  capabilities: ['dom', 'navigation', 'ui', 'luogu.page-data'],
  settings: { mode: setting.select({ title: '候选题范围', default: 'new-and-unaccepted', options: [{ value: 'new-only', label: '仅未尝试' }, { value: 'unaccepted-only', label: '仅尝试未通过' }, { value: 'new-and-unaccepted', label: '未尝试和未通过' }, { value: 'all', label: '全部题目' }] }) },
  async mount(ctx) {
    const context = await ctx.luogu.pageData.currentTraining({ signal: ctx.signal }).catch(() => null)
    if (!context || ctx.signal.aborted) return
    const mode = await ctx.settings.get('mode')
    const button = ctx.dom.create('button', { className: 'exlg-training-random', text: '随机跳题', attributes: { type: 'button' } })
    ctx.dom.style('.exlg-training-random{appearance:none;background:#fff;border:1px solid #aeb8c7;border-radius:5px;color:#3e568f;cursor:pointer;font:600 13px system-ui;padding:6px 10px}')
    ctx.dom.observe<HTMLElement>('[data-training-actions], .btn-actions, .training-operation, main', target => { if (!button.isConnected) ctx.dom.mount(target, button) })
    ctx.dom.listen(button, 'click', () => {
      const candidates = trainingCandidates(context.problems, mode)
      const candidate = candidates[Math.floor(Math.random() * candidates.length)]
      if (!candidate) { ctx.ui.toast({ message: context.problems.length ? '没有符合状态的候选题' : '题单中没有题目', tone: 'warning' }); return }
      ctx.navigation.navigate(`/problem/${candidate.problem.pid}`)
    })
  },
})
