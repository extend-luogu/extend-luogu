import { defineFeature, setting } from '@exlg/runtime'

export default defineFeature({
  id: 'official.code-block-copy',
  apiVersion: 1,
  title: '代码块复制',
  description: '为页面中的代码块添加复制按钮，并支持动态插入的内容。',
  category: 'reading',
  defaultEnabled: true,
  matches: () => true,
  capabilities: ['dom', 'clipboard'],
  settings: {
    buttonText: setting.string({
      title: '按钮文字',
      default: '复制',
    }),
    showLanguage: setting.boolean({
      title: '显示语言',
      default: true,
    }),
    position: setting.select({
      title: '按钮位置',
      default: 'top-right',
      options: [
        { value: 'top-right', label: '右上角' },
        { value: 'inline', label: '行内' },
      ],
    }),
  },
  async mount(ctx) {
    const settings = await ctx.settings.getAll()
    ctx.dom.style(`
      .exlg-next-copy-button {
        appearance: none;
        border: 1px solid #b7c4d3;
        border-radius: 5px;
        background: #fff;
        color: #334155;
        cursor: pointer;
        float: right;
        font: 12px/1.4 system-ui, sans-serif;
        margin: 5px;
        padding: 4px 8px;
        position: relative;
        z-index: 1;
      }
      .exlg-next-copy-button[data-position="inline"] {
        float: none;
        margin: 0 0 6px 0;
      }
      .exlg-next-copy-button:focus-visible { outline: 2px solid #3b82f6; }
    `)

    ctx.dom.observe<HTMLElement>('pre > code', code => {
      const parent = code.parentElement
      if (!parent) return
      const languageClass = [...code.classList].find(name => name.startsWith('language-'))
      const language = languageClass?.slice('language-'.length) ?? code.dataset.language
      const label = settings.showLanguage && language
        ? `${settings.buttonText} · ${language}`
        : settings.buttonText
      const button = ctx.dom.create('button', {
        className: 'exlg-next-copy-button',
        text: label,
        attributes: {
          type: 'button',
          'data-position': settings.position,
          'aria-label': `复制代码${language ? `（${language}）` : ''}`,
        },
      })
      ctx.dom.listen(button, 'click', () => {
        void ctx.clipboard.writeText(code.textContent ?? '').then(() => {
          button.textContent = '已复制'
        }).catch(error => {
          ctx.log.warn('复制失败', error)
          button.textContent = '复制失败'
        })
      })
      ctx.dom.mount(parent, button, 'prepend')
    })
  },
})
