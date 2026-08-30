import { defineFeature, setting } from '@exlg/runtime'

export default defineFeature({
  id: 'official.user-introduction', apiVersion: 1,
  title: '用户介绍默认显示', description: '在用户主页自动展开被折叠的个人介绍。',
  category: 'user', defaultEnabled: false,
  matches: route => route.kind === 'user' && (!route.url.hash || route.url.hash === '#main'),
  capabilities: ['dom'],
  settings: { autoExpand: setting.boolean({ title: '自动展开介绍', default: true }) },
  async mount(ctx) {
    if (!await ctx.settings.get('autoExpand')) return
    ctx.dom.observe<HTMLElement>('.introduction.marked, [data-user-introduction]', introduction => {
      if (introduction.closest('form, [contenteditable="true"], [data-editing="true"]')) return
      const previousHidden = introduction.hidden
      const previousDisplay = introduction.style.display
      const previousAria = introduction.getAttribute('aria-hidden')
      if (!previousHidden && previousDisplay !== 'none' && previousAria !== 'true') return
      introduction.hidden = false
      introduction.style.removeProperty('display')
      introduction.removeAttribute('aria-hidden')
      ctx.scope.add(() => {
        introduction.hidden = previousHidden
        introduction.style.display = previousDisplay
        if (previousAria === null) introduction.removeAttribute('aria-hidden')
        else introduction.setAttribute('aria-hidden', previousAria)
      })
    }, { attributes: true })
  },
})
