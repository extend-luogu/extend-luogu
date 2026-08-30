import type { LuoguFeatureContextExtension } from '@exlg/luogu'
import { defineFeature } from '@exlg/runtime'

export default defineFeature<Record<string, never>, LuoguFeatureContextExtension>({
  id: 'official.back-to-contest', apiVersion: 1,
  title: '返回比赛', description: '从比赛内题目快速返回比赛题目列表。',
  category: 'contest', defaultEnabled: false, matches: route => route.kind === 'problem',
  capabilities: ['dom', 'navigation', 'luogu.page-data'], settings: {},
  async mount(ctx) {
    const contestId = ctx.route.url.searchParams.get('contestId')
      ?? (await ctx.luogu.pageData.currentContest({ signal: ctx.signal }))?.contestId
    if (!contestId || !/^[1-9]\d{0,15}$/.test(contestId)) return
    const link = ctx.dom.create('a', {
      className: 'exlg-back-to-contest', text: '返回比赛题目列表',
      attributes: { href: `/contest/${contestId}#problems` },
    })
    ctx.dom.style('.exlg-back-to-contest{display:inline-flex;align-items:center;margin:8px 0;color:#4f68b2;font-weight:600;text-decoration:none}.exlg-back-to-contest:hover{text-decoration:underline}')
    ctx.dom.observe<HTMLElement>('[data-problem-actions], .btn-actions, .problem-info, .info-rows, main', target => {
      if (!link.isConnected) ctx.dom.mount(target, link)
    })
  },
})
