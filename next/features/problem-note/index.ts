import { defineFeature, setting } from '@exlg/runtime'

export default defineFeature({
  id: 'official.problem-note',
  apiVersion: 1,
  title: '本地题目笔记',
  description: '按题号在本机保存一份纯文本笔记。',
  category: 'problem',
  defaultEnabled: true,
  matches: route => route.kind === 'problem',
  capabilities: ['dom', 'storage'],
  settings: {
    defaultExpanded: setting.boolean({
      title: '默认展开',
      default: true,
    }),
    placeholder: setting.string({
      title: '输入提示',
      default: '记录思路、坑点或待办……',
    }),
  },
  async mount(ctx) {
    const problemId = ctx.route.params.problemId
    if (!problemId) return
    const settings = await ctx.settings.getAll()
    const note = await ctx.storage.get<string>(`problem:${problemId}`, '')

    const root = ctx.dom.create('aside', {
      className: 'exlg-next-problem-note',
      attributes: { 'aria-label': `${problemId} 本地笔记` },
    })
    const header = ctx.dom.create('button', {
      className: 'exlg-next-problem-note__header',
      text: `本地笔记 · ${problemId}`,
      attributes: { type: 'button', 'aria-expanded': String(settings.defaultExpanded) },
    })
    const textarea = ctx.dom.create('textarea', {
      className: 'exlg-next-problem-note__input',
      attributes: { placeholder: settings.placeholder, rows: '7' },
    })
    textarea.value = note ?? ''
    textarea.hidden = !settings.defaultExpanded
    root.append(header, textarea)

    ctx.dom.listen(header, 'click', () => {
      textarea.hidden = !textarea.hidden
      header.setAttribute('aria-expanded', String(!textarea.hidden))
    })
    const save = (): void => {
      void ctx.storage.set(`problem:${problemId}`, textarea.value).catch(error => {
        ctx.log.error('保存题目笔记失败', error)
      })
    }
    ctx.dom.listen(textarea, 'change', save)
    ctx.dom.listen(textarea, 'blur', save)
    ctx.dom.style(`
      .exlg-next-problem-note {
        background: #fff;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        bottom: 18px;
        box-shadow: 0 8px 30px rgba(15, 23, 42, .16);
        color: #1e293b;
        font: 13px/1.5 system-ui, sans-serif;
        padding: 8px;
        position: fixed;
        right: 18px;
        width: min(320px, calc(100vw - 36px));
        z-index: 2147483000;
      }
      .exlg-next-problem-note__header {
        appearance: none; background: transparent; border: 0; color: inherit;
        cursor: pointer; font: 600 13px/1.5 system-ui, sans-serif; padding: 3px;
        text-align: left; width: 100%;
      }
      .exlg-next-problem-note__input {
        border: 1px solid #cbd5e1; border-radius: 5px; box-sizing: border-box;
        color: #1e293b; display: block; font: 13px/1.5 system-ui, sans-serif;
        margin-top: 6px; padding: 7px; resize: vertical; width: 100%;
      }
      .exlg-next-problem-note__input[hidden] { display: none; }
    `)
    ctx.dom.observe('body', body => {
      if (!root.isConnected) ctx.dom.mount(body, root)
    })
  },
})
