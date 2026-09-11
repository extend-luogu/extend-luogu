/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLuoguEditorService } from '../src'
import { installEditorBridge } from '../src/editor-bridge'

beforeEach(() => { document.body.textContent = '' })
afterEach(() => { vi.useRealTimers() })

interface FakeTransaction {
  readonly changes?: { readonly from: number; readonly to: number; readonly insert: string }
  readonly selection?: { readonly anchor: number; readonly head?: number }
}

function codeMirrorFixture(source = 'hello world', initialAnchor = 6, initialHead = 11) {
  let value = source
  let anchor = initialAnchor
  let head = initialHead
  const focus = vi.fn()
  const shell = document.createElement('div')
  shell.className = 'casket cs-main'
  const toolbar = document.createElement('div')
  toolbar.className = 'cs-toolbar'
  toolbar.append(document.createElement('div'), document.createElement('div'))
  const zone = document.createElement('div')
  zone.className = 'cs-editor'
  const editor = document.createElement('div')
  editor.className = 'cm-editor'
  const content = document.createElement('div')
  content.className = 'cm-content'
  content.setAttribute('contenteditable', 'true')
  editor.append(content)
  zone.append(editor)
  shell.append(toolbar, zone)
  document.body.append(shell)

  const view = {
    get state() {
      return {
        doc: { length: value.length, toString: () => value },
        selection: {
          main: {
            anchor,
            head,
            from: Math.min(anchor, head),
            to: Math.max(anchor, head),
          },
        },
      }
    },
    dispatch(transaction: FakeTransaction) {
      const changes = transaction.changes
      if (changes) value = `${value.slice(0, changes.from)}${changes.insert}${value.slice(changes.to)}`
      const selection = transaction.selection
      if (selection) {
        anchor = selection.anchor
        head = selection.head ?? selection.anchor
      }
    },
    focus,
  }
  Object.defineProperty(content, 'cmView', { value: { view } })

  return {
    content,
    editor,
    focus,
    shell,
    value: () => value,
  }
}

function editorFixture(): HTMLTextAreaElement {
  const root = document.createElement('div')
  root.className = 'mp-editor-ground'
  const toolbar = document.createElement('div')
  toolbar.className = 'mp-editor-menu'
  toolbar.setAttribute('role', 'toolbar')
  const textarea = document.createElement('textarea')
  textarea.name = 'content'
  root.append(toolbar, textarea)
  document.body.append(root)
  return textarea
}

describe('LuoguEditorService', () => {
  it('operates the current CodeMirror 6 editor through the page-world bridge', async () => {
    const cleanupBridge = installEditorBridge(window)
    const fixture = codeMirrorFixture()
    const session = await createLuoguEditorService(document).waitForEditor({
      signal: new AbortController().signal,
    })

    expect(session).not.toBeNull()
    expect(await session?.getValue()).toBe('hello world')
    expect(await session?.getSelection()).toBe('world')
    expect(await session?.getSelectionRange()).toEqual({ start: 6, end: 11 })
    await session?.replaceSelection('ExLG')
    expect(fixture.value()).toBe('hello ExLG')
    await session?.replaceRange(0, 5, 'Hi')
    expect(fixture.value()).toBe('Hi ExLG')
    await session?.setValue('formatted text')
    expect(fixture.value()).toBe('formatted text')
    expect(await session?.getSelectionRange()).toEqual({ start: 2, end: 2 })
    await session?.focus()
    expect(fixture.focus).toHaveBeenCalledOnce()
    cleanupBridge()
  })

  it('mounts Casket toolbar actions and follows CodeMirror editor rebuilds', async () => {
    const cleanupBridge = installEditorBridge(window)
    const first = codeMirrorFixture('first', 0, 0)
    const session = await createLuoguEditorService(document).waitForEditor({
      signal: new AbortController().signal,
    })
    const clicked = vi.fn()
    const cleanupButton = session!.mountToolbarButton({
      id: 'format', label: '排版', title: '本地排版', onClick: clicked,
    })
    const firstButton = document.querySelector<HTMLButtonElement>('[data-exlg-editor-action="format"]')
    expect(firstButton?.classList.contains('cs-toolbar-tool')).toBe(true)
    expect(firstButton?.closest('.cs-toolbar-group')).not.toBeNull()
    firstButton?.click()
    expect(clicked).toHaveBeenCalledOnce()

    const keydown = vi.fn()
    const cleanupKeydown = session!.listenKeydown(keydown)
    first.content.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    expect(keydown).toHaveBeenCalledOnce()

    first.shell.remove()
    const second = codeMirrorFixture('second', 0, 0)
    await Promise.resolve()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.querySelectorAll('[data-exlg-editor-action="format"]')).toHaveLength(1)
    expect(await session?.getValue()).toBe('second')
    second.content.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', bubbles: true }))
    expect(keydown).toHaveBeenCalledTimes(2)

    cleanupKeydown()
    cleanupButton()
    cleanupBridge()
    expect(document.querySelector('[data-exlg-editor-action="format"]')).toBeNull()
  })

  it('waits for an editor, edits selection, emits input/change, and focuses', async () => {
    const service = createLuoguEditorService(document, { timeoutMs: 100 })
    const controller = new AbortController()
    const pending = service.waitForEditor({ signal: controller.signal })
    const textarea = editorFixture()
    textarea.value = 'hello world'
    textarea.setSelectionRange(6, 11)
    const input = vi.fn()
    const change = vi.fn()
    textarea.addEventListener('input', input)
    textarea.addEventListener('change', change)
    const session = await pending
    expect(session).not.toBeNull()
    expect(await session?.getSelection()).toBe('world')
    await session?.replaceSelection('ExLG')
    expect(textarea.value).toBe('hello ExLG')
    expect(input).toHaveBeenCalledOnce()
    expect(change).toHaveBeenCalledOnce()
    await session?.focus()
    expect(document.activeElement).toBe(textarea)
  })

  it('mounts toolbar actions, follows editor rebuilds, and cleans up listeners', async () => {
    const first = editorFixture()
    const session = await createLuoguEditorService(document).waitForEditor({ signal: new AbortController().signal })
    const clicked = vi.fn()
    const cleanupButton = session!.mountToolbarButton({ id: 'format', label: '排版', title: '本地排版', onClick: clicked })
    document.querySelector<HTMLButtonElement>('[data-exlg-editor-action="format"]')?.click()
    expect(clicked).toHaveBeenCalledOnce()
    first.closest('.mp-editor-ground')?.remove()
    editorFixture()
    await Promise.resolve()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(document.querySelectorAll('[data-exlg-editor-action="format"]')).toHaveLength(1)

    const keydown = vi.fn()
    const cleanupKeydown = session!.listenKeydown(keydown)
    document.querySelector('textarea')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    expect(keydown).toHaveBeenCalledOnce()
    cleanupKeydown()
    cleanupButton()
    expect(document.querySelector('[data-exlg-editor-action="format"]')).toBeNull()
  })

  it('returns null when no editor appears or the wait is aborted', async () => {
    vi.useFakeTimers()
    const service = createLuoguEditorService(document, { timeoutMs: 100 })
    const timedOut = service.waitForEditor({ signal: new AbortController().signal })
    await vi.advanceTimersByTimeAsync(100)
    await expect(timedOut).resolves.toBeNull()
    const controller = new AbortController()
    const aborted = service.waitForEditor({ signal: controller.signal })
    controller.abort()
    await expect(aborted).resolves.toBeNull()
  })
})
