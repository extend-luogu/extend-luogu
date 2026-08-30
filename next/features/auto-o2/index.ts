import { defineFeature, setting } from '@exlg/runtime'

type O2Mode = 'always' | 'remember-last-choice' | 'remember-last-submission'

export default defineFeature({
  id: 'official.auto-o2', apiVersion: 1,
  title: '自动开启 O2', description: '按选择或上次提交状态恢复 O2 编译选项。',
  category: 'problem', defaultEnabled: false, matches: route => route.kind === 'problem',
  capabilities: ['dom', 'storage'],
  settings: { mode: setting.select({
    title: '启用策略', default: 'remember-last-choice',
    options: [
      { value: 'always', label: '始终开启' },
      { value: 'remember-last-choice', label: '记住最后选择' },
      { value: 'remember-last-submission', label: '记住最后提交' },
    ],
  }) },
  async mount(ctx) {
    const mode: O2Mode = await ctx.settings.get('mode')
    let last = await ctx.storage.get<boolean>('lastEnabled', false) ?? false
    let current: HTMLInputElement | null = null
    const supported = (): boolean => {
      const language = ctx.dom.query<HTMLSelectElement>('select[name*="language"], [data-language-select] select')?.value
        ?? ctx.dom.query<HTMLElement>('.lang-select .text')?.textContent ?? ''
      return language === '' || /(?:c\+\+|cpp|gnu|clang)/i.test(language)
    }
    const remember = (checkbox: HTMLInputElement): void => {
      last = checkbox.checked
      void ctx.storage.set('lastEnabled', last)
    }
    ctx.dom.observe<HTMLInputElement>('input[type="checkbox"]', checkbox => {
      const label = checkbox.closest('label')?.textContent ?? checkbox.parentElement?.textContent ?? ''
      if (!checkbox.matches('[name*="o2" i], [id*="o2" i], [data-o2]') && !/O2\s*优化/i.test(label)) return
      current = checkbox
      if (supported() && !checkbox.checked && (mode === 'always' || last)) checkbox.click()
      if (mode === 'remember-last-choice') ctx.dom.listen(checkbox, 'change', () => remember(checkbox))
    })
    ctx.dom.observe<HTMLButtonElement>('button', button => {
      if (mode !== 'remember-last-submission') return
      if (!button.matches('[type="submit"], [data-submit-code]') && !/提交(?:评测|代码|答案)/.test(button.textContent ?? '')) return
      ctx.dom.listen(button, 'click', () => { if (current) remember(current) })
    })
    ctx.dom.observe<HTMLSelectElement>('select[name*="language"], [data-language-select] select', select => {
      ctx.dom.listen(select, 'change', () => {
        if (current && supported() && !current.checked && (mode === 'always' || last)) current.click()
      })
    })
  },
})
