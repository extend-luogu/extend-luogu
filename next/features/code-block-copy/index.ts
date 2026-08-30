import { defineFeature, setting } from '@exlg/runtime'

const settings = {
  buttonText: setting.string({ title: '按钮文字', default: '复制' }),
  showLanguage: setting.boolean({ title: '按钮显示语言', default: true }),
  position: setting.select({
    title: '按钮位置', default: 'top-right',
    options: [{ value: 'top-right', label: '右上角' }, { value: 'inline', label: '行内' }],
  }),
  showTitle: setting.boolean({ title: '显示代码标题栏', default: true }),
  titleTemplate: setting.string({ title: '标题模板', description: '使用 {lang} 代表语言', default: '代码 · {lang}' }),
  noLanguageTitle: setting.string({ title: '未知语言标题', default: '代码' }),
  fontFamily: setting.string({ title: '代码字体', description: '只接受字体族名称，不接受 CSS 声明', default: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }),
  visualStyle: setting.select({
    title: '视觉样式', default: 'subtle',
    options: [{ value: 'subtle', label: '简洁' }, { value: 'bordered', label: '描边' }],
  }),
  showCopyFeedback: setting.boolean({ title: '显示复制结果', default: true }),
} as const

function languageOf(code: HTMLElement): string | undefined {
  const className = [...code.classList].find(name => /^(?:language|lang)-/.test(name))
  return className?.replace(/^(?:language|lang)-/, '') || code.dataset.language
}

function safeFontFamily(value: string): string {
  return /[;{}]/.test(value) ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : value
}

export default defineFeature({
  id: 'official.code-block-copy', apiVersion: 1,
  title: '代码块复制', description: '增强页面代码块的标题、语言识别与复制反馈。',
  category: 'reading', defaultEnabled: true, matches: () => true,
  capabilities: ['dom', 'clipboard'], settings,
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    const timers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>()
    ctx.scope.add(() => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    })
    ctx.dom.style(`
      .exlg-code-block { position: relative; font-family: ${safeFontFamily(values.fontFamily)}; }
      .exlg-code-header { align-items:center; background:#f7f8fa; border-bottom:1px solid #e5e7eb;
        color:#64748b; display:flex; font:500 12px/1.4 system-ui,sans-serif; justify-content:space-between;
        min-height:30px; padding:0 8px; }
      .exlg-code-block[data-style="bordered"] { border:1px solid #d7dce3; border-radius:6px; overflow:hidden; }
      .exlg-code-copy { appearance:none; background:transparent; border:1px solid #cbd5e1; border-radius:4px;
        color:#475569; cursor:pointer; font:500 12px/1.3 system-ui,sans-serif; padding:3px 7px; }
      .exlg-code-copy[data-position="top-right"] { position:absolute; right:6px; top:6px; z-index:2; }
      .exlg-code-header .exlg-code-copy { position:static; }
      .exlg-code-copy:focus-visible { outline:2px solid #4f7cff; outline-offset:2px; }
    `)
    ctx.dom.observe<HTMLElement>('pre > code', code => {
      const pre = code.parentElement
      if (!pre || pre.dataset.exlgCodeBlock === 'true') return
      if (pre.closest('textarea, [contenteditable], .CodeMirror, .cm-editor, .mp-editor, .markdown-preview, [data-editor-preview]')) return
      pre.dataset.exlgCodeBlock = 'true'
      pre.classList.add('exlg-code-block')
      pre.dataset.style = values.visualStyle
      ctx.scope.add(() => {
        delete pre.dataset.exlgCodeBlock
        delete pre.dataset.style
        pre.classList.remove('exlg-code-block')
      })
      const language = languageOf(code)
      const button = ctx.dom.create('button', {
        className: 'exlg-code-copy',
        text: values.showLanguage && language ? `${values.buttonText} · ${language}` : values.buttonText,
        attributes: { type: 'button', 'data-position': values.position, 'aria-label': `复制代码${language ? `（${language}）` : ''}` },
      })
      if (values.showTitle) {
        const header = ctx.dom.create('div', { className: 'exlg-code-header' })
        const title = ctx.dom.create('span', {
          text: language ? values.titleTemplate.replaceAll('{lang}', language) : values.noLanguageTitle,
        })
        header.append(title, button)
        ctx.dom.mount(pre, header, 'prepend')
      } else ctx.dom.mount(pre, button, 'prepend')
      ctx.dom.listen(button, 'click', () => {
        const original = button.textContent ?? values.buttonText
        void ctx.clipboard.writeText(code.textContent ?? '').then(() => {
          if (values.showCopyFeedback) button.textContent = '已复制'
        }).catch(() => {
          if (values.showCopyFeedback) button.textContent = '复制失败'
        }).finally(() => {
          if (!values.showCopyFeedback || ctx.signal.aborted) return
          const timer = setTimeout(() => {
            button.textContent = original
            timers.delete(button)
          }, 1_500)
          timers.set(button, timer)
        })
      })
    })
  },
})
