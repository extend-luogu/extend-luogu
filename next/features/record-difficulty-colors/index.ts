import type { LuoguFeatureContextExtension } from '@exlg/luogu'
import { defineFeature, setting } from '@exlg/runtime'

const colors = ['#bfbfbf', '#fe4c61', '#f39c11', '#ffc116', '#52c41a', '#13c2c2', '#3498db', '#9d3dcf', '#0e1d69'] as const
const names = ['暂无评定', '入门', '普及−', '普及', '普及+/提高−', '提高', '提高+/省选−', '省选/NOI−', 'NOI/NOI+/CTS'] as const

export default defineFeature<{
  colorText: ReturnType<typeof setting.boolean>
  showDifficultyLabel: ReturnType<typeof setting.boolean>
  intensity: ReturnType<typeof setting.select<'soft' | 'normal'>>
}, LuoguFeatureContextExtension>({
  id: 'official.record-difficulty-colors', apiVersion: 1,
  title: '评测记录难度着色', description: '在评测记录列表中标记题目难度。',
  category: 'record', defaultEnabled: false, matches: route => route.kind === 'record',
  capabilities: ['dom', 'luogu.page-data'],
  settings: {
    colorText: setting.boolean({ title: '为题号文字着色', default: true }),
    showDifficultyLabel: setting.boolean({ title: '显示难度文字', default: true }),
    intensity: setting.select({ title: '颜色强度', default: 'normal', options: [{ value: 'soft', label: '柔和' }, { value: 'normal', label: '标准' }] }),
  },
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    const records = await ctx.luogu.pageData.visibleRecords({ signal: ctx.signal }).catch(() => [])
    const map = new Map(records.map(record => [record.pid.toUpperCase(), record.difficulty]))
    if (map.size === 0) return
    ctx.dom.style('.exlg-record-difficulty{font-weight:600}.exlg-record-difficulty-label{border:1px solid currentColor;border-radius:3px;font:500 11px/1.5 system-ui,sans-serif;margin-inline-start:5px;padding:0 3px;white-space:nowrap}')
    ctx.dom.observe<HTMLAnchorElement>('a[href^="/problem/"]', link => {
      const pid = link.getAttribute('href')?.match(/^\/problem\/([A-Z0-9_]+)/i)?.[1]?.toUpperCase()
      const difficulty = pid ? map.get(pid) : undefined
      if (difficulty === undefined || difficulty < 0 || difficulty >= colors.length) return
      const color = colors[difficulty]
      const difficultyName = names[difficulty]
      if (!color || !difficultyName) return
      const previousColor = link.style.color
      const previousTitle = link.getAttribute('title')
      if (values.colorText) {
        link.classList.add('exlg-record-difficulty')
        link.style.color = values.intensity === 'soft' ? `color-mix(in srgb, ${color} 72%, #64748b)` : color
      }
      link.title = `${previousTitle ? `${previousTitle} · ` : ''}难度：${difficultyName}`
      let label: HTMLElement | undefined
      if (values.showDifficultyLabel) {
        label = ctx.dom.create('span', { className: 'exlg-record-difficulty-label', text: difficultyName, attributes: { 'aria-label': `难度 ${difficultyName}` } })
        label.style.color = color
        ctx.dom.mount(link.parentNode ?? link, label)
      }
      ctx.scope.add(() => {
        link.classList.remove('exlg-record-difficulty')
        link.style.color = previousColor
        if (previousTitle === null) link.removeAttribute('title'); else link.title = previousTitle
        label?.remove()
      })
    })
  },
})
