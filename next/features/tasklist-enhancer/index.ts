import { defineFeature, setting } from '@exlg/runtime'

function taskState(item: HTMLElement): 'accepted' | 'incomplete' | 'unknown' {
  const value = item.dataset.status ?? item.getAttribute('aria-label') ?? ''
  if (/accepted|通过|完成|\bAC\b/i.test(value)) return 'accepted'
  if (/attempted|未完成|待办|失败/i.test(value)) return 'incomplete'
  if (item.querySelector('.lg-fg-green')) return 'accepted'
  if (item.querySelector('a[href^="/problem/"]')) return 'incomplete'
  return 'unknown'
}

export default defineFeature({
  id: 'official.tasklist-enhancer', apiVersion: 1,
  title: '任务计划增强', description: '隐藏已完成任务，并从剩余任务中随机跳题。',
  category: 'home', defaultEnabled: false, matches: route => route.kind === 'home',
  capabilities: ['dom', 'navigation', 'ui'],
  settings: {
    hideAccepted: setting.boolean({ title: '隐藏已通过任务', default: true }),
    showToggle: setting.boolean({ title: '显示展开/收起按钮', default: true }),
    showRandomButton: setting.boolean({ title: '显示随机按钮', default: true }),
    randomCandidates: setting.select({ title: '随机范围', default: 'unaccepted', options: [{ value: 'unaccepted', label: '未通过' }, { value: 'all-incomplete', label: '所有未完成' }] }),
  },
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    let showAccepted = false
    const originals = new Map<HTMLElement, boolean>()
    const enhance = (root: HTMLElement): void => {
      const tasks = [...root.querySelectorAll<HTMLElement>('[data-task], li[data-status], .task-item, .tasklist-item')]
      if (tasks.length === 0) return
      for (const task of tasks) {
        if (!originals.has(task)) { originals.set(task, task.hidden); ctx.scope.add(() => { task.hidden = originals.get(task) ?? false }) }
        if (values.hideAccepted && taskState(task) === 'accepted') task.hidden = !showAccepted
      }
      let actions = root.querySelector<HTMLElement>(':scope > .exlg-task-actions')
      if (!actions) { actions = ctx.dom.create('div', { className: 'exlg-task-actions' }); ctx.dom.mount(root, actions, 'prepend') }
      if (values.showToggle && !actions.querySelector('[data-action="toggle"]')) {
        const toggle = ctx.dom.create('button', { text: '显示已通过', attributes: { type: 'button', 'data-action': 'toggle' } })
        ctx.dom.listen(toggle, 'click', () => { showAccepted = !showAccepted; toggle.textContent = showAccepted ? '隐藏已通过' : '显示已通过'; enhance(root) })
        actions.append(toggle)
      }
      if (values.showRandomButton && !actions.querySelector('[data-action="random"]')) {
        const random = ctx.dom.create('button', { text: '随机任务', attributes: { type: 'button', 'data-action': 'random' } })
        ctx.dom.listen(random, 'click', () => {
          const candidates = tasks.filter(task => taskState(task) !== 'accepted' && (values.randomCandidates === 'all-incomplete' || taskState(task) === 'incomplete'))
          const link = candidates[Math.floor(Math.random() * candidates.length)]?.querySelector<HTMLAnchorElement>('a[href^="/problem/"]')
          const href = link?.getAttribute('href')
          if (href) ctx.navigation.navigate(href); else ctx.ui.toast({ message: '没有可随机跳转的任务', tone: 'warning' })
        })
        actions.append(random)
      }
    }
    ctx.dom.style('.exlg-task-actions{display:flex;gap:6px;margin:6px 0}.exlg-task-actions button{appearance:none;background:transparent;border:1px solid #c2c9d3;border-radius:4px;color:#4f68b2;cursor:pointer;padding:4px 7px}')
    ctx.dom.observe<HTMLElement>('[data-task-list], section[aria-label*="任务"], .task-list, .lg-article', root => {
      const heading = root.querySelector('h1,h2,h3')?.textContent ?? root.getAttribute('aria-label') ?? ''
      if (root.matches('.lg-article') && !heading.includes('任务')) return
      enhance(root)
    })
    ctx.dom.observe<HTMLElement>('[data-task], li[data-status], .task-item, .tasklist-item', item => {
      const root = item.closest<HTMLElement>('[data-task-list], section[aria-label*="任务"], .task-list, .lg-article')
      if (root) enhance(root)
    })
  },
})
