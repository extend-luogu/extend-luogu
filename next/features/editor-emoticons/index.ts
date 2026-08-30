import type { LuoguEditorSession, LuoguFeatureContextExtension } from '@exlg/luogu'
import { defineFeature, setting } from '@exlg/runtime'

const emoticons = [
  { group: 'faces', name: 'smile', label: '微笑', text: '（・∀・）' },
  { group: 'faces', name: 'happy', label: '开心', text: 'ヾ(≧▽≦*)o' },
  { group: 'faces', name: 'thinking', label: '思考', text: '（￣～￣;）' },
  { group: 'actions', name: 'tableflip', label: '掀桌', text: '（╯°□°）╯︵ ┻━┻' },
  { group: 'actions', name: 'cheer', label: '加油', text: '٩(ˊᗜˋ*)و' },
  { group: 'animals', name: 'cat', label: '猫猫', text: 'ฅ( ̳• ·̫ • ̳ฅ)' },
] as const

const settings = {
  enableSlashAliases: setting.boolean({ title: '启用 /name/ 快捷替换', default: true }),
  panelInitiallyOpen: setting.boolean({ title: '面板默认展开', default: false }),
  enabledGroups: setting.multiSelect({
    title: '启用分组', default: ['faces', 'actions', 'animals'],
    options: [{ value: 'faces', label: '表情' }, { value: 'actions', label: '动作' }, { value: 'animals', label: '动物' }],
  }),
} as const

function installAliases(session: LuoguEditorSession, enabled: ReadonlySet<string>): () => void {
  return session.listenKeydown(event => {
    if (event.isComposing || ![' ', 'Enter', 'Tab'].includes(event.key)) return
    void Promise.all([session.getValue(), session.getSelectionRange()]).then(async ([value, range]) => {
      if (range.start !== range.end) return
      const prefix = value.slice(0, range.start)
      const match = prefix.match(/\/([a-z][a-z0-9-]{1,24})\/$/i)
      const item = match && emoticons.find(candidate => candidate.name === match[1] && enabled.has(candidate.group))
      if (!match || !item) return
      await session.replaceRange(range.start - match[0].length, range.start, item.text)
    })
  })
}

export default defineFeature<typeof settings, LuoguFeatureContextExtension>({
  id: 'official.editor-emoticons', apiVersion: 1,
  title: '编辑器表情面板', description: '为讨论和博客编辑器提供本地文字表情。',
  category: 'editor', defaultEnabled: false,
  matches: route => route.kind === 'discussion' || route.kind === 'blog',
  capabilities: ['dom', 'luogu.editor'], settings,
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    const editor = await ctx.luogu.editor.waitForEditor({ signal: ctx.signal })
    if (!editor || ctx.signal.aborted) return
    const enabled = new Set(values.enabledGroups)
    const host = ctx.dom.create('div', { className: 'exlg-emoticon-host' })
    const root = host.attachShadow({ mode: 'open' })
    const style = ctx.dom.create('style', { text: `
      :host{position:fixed;right:18px;bottom:18px;z-index:2147482800;font:13px system-ui,sans-serif;color:#1f2937}
      .panel{background:#fff;border:1px solid #d7dce3;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,.14);padding:8px;width:240px}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.item{background:#f7f8fa;border:1px solid #e2e6eb;border-radius:5px;cursor:pointer;min-height:42px;padding:5px}.item:hover{background:#eef1f6}.name{color:#64748b;display:block;font-size:10px;margin-top:2px}
    ` })
    const panel = ctx.dom.create('div', { className: 'panel', attributes: { 'aria-label': '文字表情', role: 'dialog' } })
    panel.hidden = !values.panelInitiallyOpen
    const grid = ctx.dom.create('div', { className: 'grid' })
    for (const item of emoticons.filter(item => enabled.has(item.group))) {
      const button = ctx.dom.create('button', { className: 'item', text: item.text, attributes: { type: 'button', title: item.label, 'data-emoticon': item.name } })
      const name = ctx.dom.create('span', { className: 'name', text: `/${item.name}/` })
      button.append(name)
      grid.append(button)
    }
    panel.append(grid)
    root.append(style, panel)
    ctx.dom.mount('body', host)
    ctx.dom.listen(root, 'click', event => {
      const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-emoticon]') : null
      const item = emoticons.find(candidate => candidate.name === target?.dataset.emoticon && enabled.has(candidate.group))
      if (item) void editor.insertText(item.text).then(() => editor.focus())
    })
    ctx.scope.add(editor.mountToolbarButton({
      id: 'emoticons', label: '表情', title: '打开 ExLG 文字表情',
      onClick: () => { panel.hidden = !panel.hidden },
    }))
    if (values.enableSlashAliases) ctx.scope.add(installAliases(editor, enabled))
  },
})
