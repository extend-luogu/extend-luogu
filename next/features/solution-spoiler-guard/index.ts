import { defineFeature, setting } from '@exlg/runtime'

const settings = {
  mode: setting.select({
    title: '题解入口处理方式', default: 'confirm',
    options: [{ value: 'hide', label: '隐藏' }, { value: 'dim', label: '淡化' }, { value: 'confirm', label: '点击确认' }],
  }),
  rememberRevealWithinPage: setting.boolean({ title: '本页内记住临时显示', default: true }),
  hideDifficulty: setting.boolean({ title: '同时隐藏难度', default: false }),
  hideAcceptanceRate: setting.boolean({ title: '同时隐藏通过率', default: false }),
} as const

export default defineFeature({
  id: 'official.solution-spoiler-guard', apiVersion: 1,
  title: '题解防剧透', description: '隐藏、淡化或在打开题解前要求确认。',
  category: 'problem', defaultEnabled: false, matches: route => route.kind === 'problem',
  capabilities: ['dom', 'navigation', 'ui'], settings,
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    let revealed = false
    ctx.dom.style(`
      .exlg-solution-guard--hide { display:none !important; }
      .exlg-solution-guard--dim { opacity:.22; transition:opacity .16s ease; }
      .exlg-solution-guard--dim:is(:hover,:focus-visible) { opacity:1; }
      .exlg-spoiler-value { filter:blur(5px); transition:filter .16s ease; }
      .exlg-spoiler-value:is(:hover,:focus-within) { filter:none; }
    `)
    ctx.dom.observe<HTMLAnchorElement>('a[href^="/problem/solution/"], a[href*="/problem/solution/"]', link => {
      if (values.mode === 'hide') link.classList.add('exlg-solution-guard--hide')
      if (values.mode === 'dim') link.classList.add('exlg-solution-guard--dim')
      ctx.scope.add(() => link.classList.remove('exlg-solution-guard--hide', 'exlg-solution-guard--dim'))
      if (values.mode !== 'confirm') return
      ctx.dom.listen(link, 'click', event => {
        if (revealed) return
        event.preventDefault()
        const href = link.getAttribute('href')
        void ctx.ui.confirm({ title: '查看题解？', description: '题解可能包含关键思路与完整答案。', confirmLabel: '继续查看' })
          .then(confirmed => {
            if (!confirmed || !href || ctx.signal.aborted) return
            revealed = values.rememberRevealWithinPage
            ctx.navigation.navigate(href)
          })
      })
    })
    const blur = (selector: string): void => ctx.dom.observe<HTMLElement>(selector, element => {
      element.classList.add('exlg-spoiler-value')
      ctx.scope.add(() => element.classList.remove('exlg-spoiler-value'))
    })
    if (values.hideDifficulty) blur('[data-difficulty], .problem-difficulty')
    if (values.hideAcceptanceRate) blur('[data-acceptance-rate], .acceptance-rate')
  },
})
