/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLuoguEditorService } from '../src'

beforeEach(() => { document.body.textContent = '' })
afterEach(() => { vi.useRealTimers() })

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
