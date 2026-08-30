import { defineFeature, setting } from '@exlg/runtime'
import { navigationIntents, normalizeProblemId } from './parser'

interface UserSearchResponse { readonly users?: readonly { readonly uid?: unknown; readonly name?: unknown }[] }

export default defineFeature({
  id: 'official.quick-navigation', apiVersion: 1,
  title: '快捷导航', description: '使用命令面板快速跳转到常用页面、题目与用户。',
  category: 'navigation', defaultEnabled: false, matches: () => true,
  capabilities: ['dom', 'navigation', 'ui', 'network.luogu', 'storage'],
  settings: {
    doubleClickProblemId: setting.boolean({ title: '双击明确题号时跳转', default: false }),
    rememberHistory: setting.boolean({ title: '记住最近跳转', default: true }),
    maxHistory: setting.number({ title: '历史条数', default: 20, min: 1, max: 50, step: 1, integer: true }),
    shortcutEnabled: setting.boolean({ title: '启用 Alt + K', default: true }),
  },
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    const storedHistory = await ctx.storage.get<readonly string[]>('history', [])
    let history = Array.isArray(storedHistory)
      ? storedHistory.filter((item): item is string => typeof item === 'string' && /^\/(?!\/)[^\s]{0,160}$/.test(item)).slice(0, values.maxHistory)
      : []
    const host = ctx.dom.create('div', { className: 'exlg-palette-host' })
    const root = host.attachShadow({ mode: 'open' })
    const style = ctx.dom.create('style', { text: `:host{font:14px system-ui,sans-serif}.backdrop{align-items:flex-start;background:rgba(15,23,42,.4);display:flex;inset:0;justify-content:center;padding-top:12vh;position:fixed;z-index:2147483100}.backdrop[hidden]{display:none}.panel{background:#fff;border:1px solid #d5dae1;border-radius:10px;box-shadow:0 16px 46px rgba(15,23,42,.22);max-width:calc(100vw - 32px);overflow:hidden;width:520px}.search{border:0;border-bottom:1px solid #e5e7eb;box-sizing:border-box;font:16px system-ui;padding:15px;width:100%}.list{list-style:none;margin:0;max-height:340px;overflow:auto;padding:6px}.item{background:transparent;border:0;border-radius:6px;color:#1f2937;cursor:pointer;display:block;padding:10px;text-align:left;width:100%}.item[data-active="true"],.item:hover{background:#eef2ff}.empty{color:#64748b;padding:18px}` })
    const backdrop = ctx.dom.create('div', { className: 'backdrop', attributes: { role: 'dialog', 'aria-modal': 'true', 'aria-label': '快捷导航' } })
    backdrop.hidden = true
    const panel = ctx.dom.create('div', { className: 'panel' })
    const input = ctx.dom.create('input', { className: 'search', attributes: { type: 'search', placeholder: '输入页面名称、题号、用户 UID，或“用户名 xxx”' } })
    const list = ctx.dom.create('div', { className: 'list', attributes: { role: 'listbox' } })
    panel.append(input, list); backdrop.append(panel); root.append(style, backdrop); ctx.dom.mount('body', host)
    let selected = 0
    let intents = navigationIntents('')
    let previousFocus: HTMLElement | null = null
    const render = (): void => {
      list.replaceChildren()
      const query = input.value.trim()
      const base = navigationIntents(query)
      const recent = query ? [] : history.map(path => ({ label: `最近：${path}`, path }))
      intents = [...recent, ...base.filter(item => !history.includes(item.path))]
      selected = Math.min(selected, Math.max(0, intents.length - 1))
      if (intents.length === 0) list.append(ctx.dom.create('div', { className: 'empty', text: '未找到本地动作；可输入“用户名 xxx”搜索用户。' }))
      for (const [index, item] of intents.entries()) list.append(ctx.dom.create('button', { className: 'item', text: item.label, attributes: { type: 'button', role: 'option', 'data-index': String(index), 'data-active': String(index === selected) } }))
    }
    const close = (): void => {
      if (backdrop.hidden) return
      backdrop.hidden = true; input.value = ''; render()
      previousFocus?.focus(); previousFocus = null
    }
    const open = (): void => {
      previousFocus = host.ownerDocument.activeElement instanceof HTMLElement ? host.ownerDocument.activeElement : null
      backdrop.hidden = false; render(); input.focus()
    }
    const saveHistory = (path: string): void => {
      if (!values.rememberHistory) return
      history = [path, ...history.filter(item => item !== path)].slice(0, values.maxHistory)
      void ctx.storage.set('history', history)
    }
    const execute = async (): Promise<void> => {
      const username = input.value.trim().match(/^(?:用户名|username)\s+(.{1,32})$/i)?.[1]
      if (username) {
        try {
          const response = await ctx.network.request<UserSearchResponse>('luogu', { path: '/api/user/search', query: { keyword: username }, responseType: 'json', signal: ctx.signal })
          const uid = response.data.users?.find(user => Number.isSafeInteger(user.uid) && Number(user.uid) > 0)?.uid
          if (typeof uid === 'number') { saveHistory(`/user/${uid}`); ctx.navigation.navigate(`/user/${uid}`); return }
          ctx.ui.toast({ message: '没有找到用户', tone: 'warning' })
        } catch { ctx.ui.toast({ message: '用户搜索暂时不可用', tone: 'error' }) }
        return
      }
      const item = intents[selected]
      if (!item) return
      saveHistory(item.path); close(); ctx.navigation.navigate(item.path)
    }
    ctx.dom.listen(input, 'input', () => { selected = 0; render() })
    ctx.dom.listen(input, 'keydown', event => {
      const keyboard = event as KeyboardEvent
      if (keyboard.isComposing) return
      if (keyboard.key === 'Escape') { keyboard.preventDefault(); close() }
      else if (keyboard.key === 'ArrowDown') { keyboard.preventDefault(); selected = Math.min(selected + 1, intents.length - 1); render() }
      else if (keyboard.key === 'ArrowUp') { keyboard.preventDefault(); selected = Math.max(0, selected - 1); render() }
      else if (keyboard.key === 'Enter') { keyboard.preventDefault(); void execute() }
    })
    ctx.dom.listen(backdrop, 'keydown', event => {
      const keyboard = event as KeyboardEvent
      if (keyboard.key === 'Escape') { keyboard.preventDefault(); close(); return }
      if (keyboard.key !== 'Tab') return
      const focusable = [...root.querySelectorAll<HTMLElement>('input,button:not([disabled])')].filter(element => !element.hidden)
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return
      if (keyboard.shiftKey && root.activeElement === first) { keyboard.preventDefault(); last.focus() }
      else if (!keyboard.shiftKey && root.activeElement === last) { keyboard.preventDefault(); first.focus() }
    })
    ctx.dom.listen(root, 'click', event => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-index]') : null
      if (button) { selected = Number(button.dataset.index); void execute() }
      else if (event.target === backdrop) close()
    })
    ctx.dom.observe<HTMLElement>('body', body => {
      if (values.shortcutEnabled) ctx.dom.listen(body, 'keydown', event => {
        const keyboard = event as KeyboardEvent
        if (keyboard.altKey && !keyboard.ctrlKey && !keyboard.metaKey && keyboard.key.toLowerCase() === 'k' && !keyboard.isComposing && !ctx.dom.isEditableTarget(keyboard.target)) {
          keyboard.preventDefault(); backdrop.hidden ? open() : close()
        }
      })
      if (values.doubleClickProblemId) ctx.dom.listen(body, 'dblclick', event => {
        if (ctx.dom.isEditableTarget(event.target)) return
        const pid = normalizeProblemId(ctx.dom.getSelectionText(), false)
        if (pid) ctx.navigation.open(`/problem/${pid}`)
      })
    })
  },
})
