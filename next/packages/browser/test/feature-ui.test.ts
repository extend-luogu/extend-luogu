/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createScope } from '@exlg/runtime'
import { createFeatureUiService } from '../src'

beforeEach(() => {
  document.body.textContent = ''
  vi.useFakeTimers()
})
afterEach(() => { vi.useRealTimers() })

function root(): ShadowRoot {
  return document.querySelector<HTMLElement>('.exlg-next-feature-ui-host')!.shadowRoot!
}

describe('FeatureUiService', () => {
  it('renders text-only toast and removes it with the Scope', async () => {
    const scope = createScope()
    const ui = createFeatureUiService(document, scope)
    ui.toast({ message: '<b>safe</b>', tone: 'success', durationMs: 500 })
    expect(root().querySelector('.toast')?.textContent).toBe('<b>safe</b>')
    expect(root().querySelector('b')).toBeNull()
    await scope.dispose()
    expect(document.querySelector('.exlg-next-feature-ui-host')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resolves confirm and prompt safely on action, Escape, and disposal', async () => {
    const scope = createScope()
    const ui = createFeatureUiService(document, scope)
    const confirmed = ui.confirm({ title: 'Confirm', description: 'Description' })
    root().querySelectorAll<HTMLButtonElement>('button')[1]?.click()
    await expect(confirmed).resolves.toBe(true)

    const prompted = ui.prompt({ title: 'Prompt', label: 'Note', initialValue: 'value' })
    root().querySelector('.backdrop')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await expect(prompted).resolves.toBeNull()

    const disposed = ui.confirm({ title: 'Dispose', description: 'Dispose' })
    await scope.dispose()
    await expect(disposed).resolves.toBe(false)
  })

  it('traps focus inside a modal dialog', async () => {
    const scope = createScope()
    const ui = createFeatureUiService(document, scope)
    const pending = ui.prompt({ title: 'Prompt', label: 'Value' })
    const buttons = root().querySelectorAll<HTMLButtonElement>('button')
    const input = root().querySelector<HTMLInputElement>('input')!
    buttons[1]?.focus()
    root().querySelector('.backdrop')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(root().activeElement).toBe(input)
    input.focus()
    root().querySelector('.backdrop')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(root().activeElement).toBe(buttons[1])
    await scope.dispose()
    await expect(pending).resolves.toBeNull()
  })
})
