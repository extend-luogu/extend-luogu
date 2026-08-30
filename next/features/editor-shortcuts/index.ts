import type { LuoguEditorSession, LuoguFeatureContextExtension } from '@exlg/luogu'
import { defineFeature, setting } from '@exlg/runtime'

async function wrap(session: LuoguEditorSession, marker: string, placeholder: string): Promise<void> {
  const selected = await session.getSelection()
  await session.replaceSelection(`${marker}${selected || placeholder}${marker}`)
  await session.focus()
}

export default defineFeature<{
  bold: ReturnType<typeof setting.boolean>
  italic: ReturnType<typeof setting.boolean>
  strike: ReturnType<typeof setting.boolean>
  submit: ReturnType<typeof setting.boolean>
}, LuoguFeatureContextExtension>({
  id: 'official.editor-shortcuts', apiVersion: 1,
  title: '编辑器快捷键', description: '为 Markdown 编辑器补充常用格式快捷键。',
  category: 'editor', defaultEnabled: false,
  matches: route => route.kind === 'discussion' || route.kind === 'blog',
  capabilities: ['ui', 'luogu.editor'],
  settings: {
    bold: setting.boolean({ title: '粗体 Ctrl/Cmd + B', default: true }),
    italic: setting.boolean({ title: '斜体 Ctrl/Cmd + I', default: true }),
    strike: setting.boolean({ title: '删除线 Ctrl/Cmd + Shift + X', default: true }),
    submit: setting.boolean({ title: '提交 Ctrl/Cmd + Enter', description: '使用站点正常表单提交流程', default: false }),
  },
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    const editor = await ctx.luogu.editor.waitForEditor({ signal: ctx.signal })
    if (!editor || ctx.signal.aborted) return
    ctx.scope.add(editor.listenKeydown(event => {
      if (event.isComposing || (!event.ctrlKey && !event.metaKey) || event.altKey) return
      const key = event.key.toLowerCase()
      let operation: Promise<void> | undefined
      if (key === 'b' && !event.shiftKey && values.bold) operation = wrap(editor, '**', '粗体')
      else if (key === 'i' && !event.shiftKey && values.italic) operation = wrap(editor, '*', '斜体')
      else if (key === 'x' && event.shiftKey && values.strike) operation = wrap(editor, '~~', '删除线')
      else if (key === 'enter' && values.submit) operation = editor.submit?.()
      if (!operation) return
      event.preventDefault()
      void operation.catch(() => ctx.ui.toast({ message: '编辑器操作失败', tone: 'error' }))
    }))
  },
})
