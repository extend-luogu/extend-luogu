import { defineFeature, setting } from '@exlg/runtime'
import { sanitizeNote, sanitizeNotesData, type UserNotesData } from './notes'

export default defineFeature({
  id: 'official.user-notes', apiVersion: 1,
  title: '用户备注', description: '在本机为用户添加私有备注，并在用户链接旁显示。',
  category: 'user', defaultEnabled: false, matches: () => true,
  capabilities: ['dom', 'storage', 'ui'],
  settings: {
    displayMode: setting.select({ title: '显示方式', default: 'append', options: [{ value: 'append', label: '追加' }, { value: 'replace', label: '替换用户名' }, { value: 'title-only', label: '仅悬停标题' }] }),
    showUidInEditor: setting.boolean({ title: '编辑时显示 UID', default: true }),
  },
  async mount(ctx) {
    const values = await ctx.settings.getAll()
    let data = sanitizeNotesData(await ctx.storage.get<UserNotesData>('notes-v1'))
    const originals = new Map<HTMLAnchorElement, {
      readonly children: readonly Node[]
      readonly title: string | null
      readonly ariaLabel: string | null
    }>()
    ctx.dom.style('.exlg-user-note{background:#eef1f6;border:1px solid #d8dde5;border-radius:3px;color:#596579;font:500 11px/1.4 system-ui,sans-serif;margin-inline-start:4px;padding:1px 3px}.exlg-user-note-editor{background:#fff;border:1px solid #b9c2d0;border-radius:5px;bottom:18px;color:#40547f;cursor:pointer;font:600 12px system-ui;padding:6px 9px;position:fixed;left:18px;z-index:2147482700}')
    const restore = (link: HTMLAnchorElement): void => {
      const original = originals.get(link)
      if (!original) return
      link.replaceChildren(...original.children)
      if (original.title === null) link.removeAttribute('title'); else link.title = original.title
      if (original.ariaLabel === null) link.removeAttribute('aria-label'); else link.setAttribute('aria-label', original.ariaLabel)
      delete link.dataset.exlgUserNote
    }
    const renderLink = (link: HTMLAnchorElement): void => {
      const uid = link.getAttribute('href')?.match(/^\/user\/([1-9]\d*)(?:[/?#]|$)/)?.[1]
      const note = uid ? data.notes[uid]?.text : undefined
      if (!uid || link.querySelector('img,svg')) return
      if (!originals.has(link)) {
        originals.set(link, {
          children: [...link.childNodes],
          title: link.getAttribute('title'),
          ariaLabel: link.getAttribute('aria-label'),
        })
      } else restore(link)
      if (!note) return
      const original = originals.get(link)
      if (!original) return
      link.dataset.exlgUserNote = 'true'
      if (values.displayMode === 'title-only') link.title = `${original.title ? `${original.title} · ` : ''}备注：${note}`
      else if (values.displayMode === 'append') {
        const badge = ctx.dom.create('span', { className: 'exlg-user-note', text: note })
        link.append(badge)
      } else {
        const originalName = link.textContent ?? ''
        link.replaceChildren(link.ownerDocument.createTextNode(note))
        link.title = `${original.title ? `${original.title} · ` : ''}原用户名：${originalName.trim()}`
        link.setAttribute('aria-label', `${originalName.trim()}，备注 ${note}`)
      }
    }
    ctx.dom.observe<HTMLAnchorElement>('a[href^="/user/"]', renderLink)
    ctx.scope.add(() => { for (const link of originals.keys()) restore(link) })
    const uid = ctx.route.kind === 'user' ? ctx.route.params.userId : undefined
    if (!uid || !/^[1-9]\d*$/.test(uid)) return
    const editor = ctx.dom.create('button', { className: 'exlg-user-note-editor', text: data.notes[uid] ? '编辑用户备注' : '添加用户备注', attributes: { type: 'button' } })
    ctx.dom.mount('body', editor)
    ctx.dom.listen(editor, 'click', () => {
      const label = values.showUidInEditor ? `备注（UID ${uid}，留空清除）` : '备注（留空清除）'
      void ctx.ui.prompt({ title: '用户备注', label, initialValue: data.notes[uid]?.text ?? '', maxLength: 80 }).then(async result => {
        if (result === null || ctx.signal.aborted) return
        const text = sanitizeNote(result)
        const notes = { ...data.notes }
        if (text) notes[uid] = { text, updatedAt: Date.now() }; else delete notes[uid]
        data = { version: 1, notes }
        await ctx.storage.set('notes-v1', data)
        editor.textContent = text ? '编辑用户备注' : '添加用户备注'
        for (const link of ctx.dom.queryAll<HTMLAnchorElement>('a[href^="/user/"]')) renderLink(link)
        ctx.ui.toast({ message: text ? '备注已保存' : '备注已清除', tone: 'success' })
      }).catch(() => ctx.ui.toast({ message: '备注保存失败', tone: 'error' }))
    })
  },
})
