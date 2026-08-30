import type { LuoguFeatureContextExtension } from '@exlg/luogu'
import { defineFeature, setting } from '@exlg/runtime'
import { formatMarkdown } from './formatter'

const settings = {
  spacingCjkLatin: setting.boolean({ title: '中文与拉丁字母间加空格', default: true }),
  spacingCjkNumber: setting.boolean({ title: '中文与数字间加空格', default: true }),
  spacingInlineMath: setting.boolean({ title: '中文与行内公式间加空格', default: true }),
  normalizeSpaces: setting.boolean({ title: '合并连续空格', default: false }),
  normalizePunctuation: setting.boolean({ title: '规范中文标点', default: false }),
} as const

export default defineFeature<typeof settings, LuoguFeatureContextExtension>({
  id: 'official.editor-formatting', apiVersion: 1,
  title: '编辑器本地排版', description: '在本机安全整理中英文间距，不上传正文。',
  category: 'editor', defaultEnabled: false,
  matches: route => route.kind === 'discussion' || route.kind === 'blog',
  capabilities: ['luogu.editor', 'ui'], settings,
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    const editor = await ctx.luogu.editor.waitForEditor({ signal: ctx.signal })
    if (!editor || ctx.signal.aborted) return
    ctx.scope.add(editor.mountToolbarButton({
      id: 'local-formatting', label: '本地排版', title: '使用 ExLG 本地排版，不上传正文',
      onClick: () => {
        void editor.getValue().then(async source => {
          const formatted = formatMarkdown(source, values)
          if (formatted === source) {
            ctx.ui.toast({ message: '没有需要调整的内容' })
            return
          }
          await editor.setValue(formatted)
          await editor.focus()
          ctx.ui.toast({ message: '排版完成', tone: 'success' })
        }).catch(() => ctx.ui.toast({ message: '本地排版失败', tone: 'error' }))
      },
    }))
  },
})
