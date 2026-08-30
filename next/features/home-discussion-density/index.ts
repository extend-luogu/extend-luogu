import { defineFeature, setting } from '@exlg/runtime'

export default defineFeature({
  id: 'official.home-discussion-density', apiVersion: 1,
  title: '主页讨论显示数量', description: '限制首页讨论列表长度，并可临时展开全部。',
  category: 'home', defaultEnabled: false, matches: route => route.kind === 'home',
  capabilities: ['dom'],
  settings: {
    maxDiscussions: setting.number({ title: '最多显示', default: 12, min: 4, max: 30, step: 1, integer: true }),
    showExpandButton: setting.boolean({ title: '显示展开按钮', default: true }),
  },
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    let expanded = false
    const handled = new WeakSet<HTMLElement>()
    const apply = (container: HTMLElement): void => {
      const items = [...container.querySelectorAll<HTMLElement>(':scope > [data-discussion-item], :scope > .am-panel, :scope > li')]
      if (items.length === 0) return
      for (const [index, item] of items.entries()) {
        const previous = item.hidden
        item.hidden = !expanded && index >= values.maxDiscussions
        if (!handled.has(item)) {
          handled.add(item)
          ctx.scope.add(() => { item.hidden = previous })
        }
      }
      if (!values.showExpandButton || items.length <= values.maxDiscussions) return
      let button = container.querySelector<HTMLButtonElement>(':scope > .exlg-discussion-toggle')
      if (!button) {
        button = ctx.dom.create('button', { className: 'exlg-discussion-toggle', attributes: { type: 'button' } })
        ctx.dom.listen(button, 'click', () => { expanded = !expanded; apply(container) })
        ctx.dom.mount(container, button)
      }
      button.textContent = expanded ? '收起讨论' : `显示全部（${items.length}）`
    }
    ctx.dom.style('.exlg-discussion-toggle{appearance:none;background:transparent;border:0;color:#4f68b2;cursor:pointer;font:500 13px system-ui;padding:8px 0}')
    ctx.dom.observe<HTMLElement>('[data-home-discussions], section[aria-label*="讨论"], .lg-article', container => {
      const heading = container.querySelector('h1,h2,h3')?.textContent ?? container.getAttribute('aria-label') ?? ''
      if (!container.hasAttribute('data-home-discussions') && !heading.includes('讨论')) return
      apply(container)
    })
    ctx.dom.observe<HTMLElement>('[data-discussion-item], .am-panel', item => {
      const container = item.closest<HTMLElement>('[data-home-discussions], section[aria-label*="讨论"], .lg-article')
      const heading = container?.querySelector('h1,h2,h3')?.textContent ?? container?.getAttribute('aria-label') ?? ''
      if (container && (container.hasAttribute('data-home-discussions') || heading.includes('讨论'))) apply(container)
    })
  },
})
