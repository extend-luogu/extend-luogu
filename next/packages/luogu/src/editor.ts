import type { Cleanup } from '@exlg/runtime'

export type LuoguEditorKind = 'discussion' | 'blog' | 'other'

export interface LuoguEditorSession {
  readonly kind: LuoguEditorKind
  getValue(): Promise<string>
  setValue(value: string): Promise<void>
  getSelection(): Promise<string>
  getSelectionRange(): Promise<{ readonly start: number; readonly end: number }>
  insertText(text: string): Promise<void>
  replaceSelection(text: string): Promise<void>
  replaceRange(start: number, end: number, text: string): Promise<void>
  focus(): Promise<void>
  submit?(): Promise<void>
  listenKeydown(listener: (event: KeyboardEvent) => void): Cleanup
  mountToolbarButton(options: {
    readonly id: string
    readonly label: string
    readonly title: string
    readonly onClick: () => void
  }): Cleanup
}

export interface LuoguEditorService {
  waitForEditor(options: { readonly signal: AbortSignal }): Promise<LuoguEditorSession | null>
}

const editorSelectors = [
  '.mp-editor-ground textarea',
  '.CodeMirror-wrap textarea',
  'textarea[name="content"]',
  'textarea[name="description"]',
] as const

function findTextarea(document: Document): HTMLTextAreaElement | null {
  for (const selector of editorSelectors) {
    const element = document.querySelector<HTMLTextAreaElement>(selector)
    if (element && !element.disabled) return element
  }
  return null
}

function editorKind(pathname: string): LuoguEditorKind {
  if (pathname.startsWith('/discuss/')) return 'discussion'
  if (pathname.startsWith('/blog') || pathname.startsWith('/blogAdmin/')) return 'blog'
  return 'other'
}

function dispatchEdit(textarea: HTMLTextAreaElement): void {
  const EventConstructor = textarea.ownerDocument.defaultView?.Event ?? Event
  textarea.dispatchEvent(new EventConstructor('input', { bubbles: true }))
  textarea.dispatchEvent(new EventConstructor('change', { bubbles: true }))
}

class DomEditorSession implements LuoguEditorSession {
  readonly kind: LuoguEditorKind
  readonly #document: Document
  readonly #initial: HTMLTextAreaElement

  constructor(document: Document, initial: HTMLTextAreaElement, kind: LuoguEditorKind) {
    this.#document = document
    this.#initial = initial
    this.kind = kind
  }

  #textarea(): HTMLTextAreaElement {
    const textarea = this.#initial.isConnected ? this.#initial : findTextarea(this.#document)
    if (!textarea) throw new Error('Luogu editor is no longer available')
    return textarea
  }

  async getValue(): Promise<string> { return this.#textarea().value }

  async setValue(value: string): Promise<void> {
    const textarea = this.#textarea()
    const start = Math.min(textarea.selectionStart, value.length)
    const end = Math.min(textarea.selectionEnd, value.length)
    textarea.value = value
    textarea.setSelectionRange(start, end)
    dispatchEdit(textarea)
  }

  async getSelection(): Promise<string> {
    const textarea = this.#textarea()
    return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
  }

  async getSelectionRange(): Promise<{ readonly start: number; readonly end: number }> {
    const textarea = this.#textarea()
    return { start: textarea.selectionStart, end: textarea.selectionEnd }
  }

  async insertText(text: string): Promise<void> { await this.replaceSelection(text) }

  async replaceSelection(text: string): Promise<void> {
    const textarea = this.#textarea()
    textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end')
    dispatchEdit(textarea)
  }

  async replaceRange(start: number, end: number, text: string): Promise<void> {
    const textarea = this.#textarea()
    const safeStart = Math.max(0, Math.min(start, textarea.value.length))
    const safeEnd = Math.max(safeStart, Math.min(end, textarea.value.length))
    textarea.setRangeText(text, safeStart, safeEnd, 'end')
    dispatchEdit(textarea)
  }

  async focus(): Promise<void> { this.#textarea().focus() }

  async submit(): Promise<void> {
    const textarea = this.#textarea()
    const form = textarea.closest('form')
    if (form) {
      form.requestSubmit()
      return
    }
    const root = textarea.closest('.mp-editor-ground, .mp-editor, [class*="editor"]') ?? textarea.parentElement
    root?.querySelector<HTMLButtonElement>('button[type="submit"], button[data-submit-code]')?.click()
  }

  listenKeydown(listener: (event: KeyboardEvent) => void): Cleanup {
    const accept = (event: KeyboardEvent): void => {
      if (event.target === this.#textarea()) listener(event)
    }
    this.#document.addEventListener('keydown', accept)
    return () => this.#document.removeEventListener('keydown', accept)
  }

  mountToolbarButton(options: {
    readonly id: string
    readonly label: string
    readonly title: string
    readonly onClick: () => void
  }): Cleanup {
    const buttons = new Set<HTMLButtonElement>()
    const attach = (): void => {
      const textarea = this.#textarea()
      const editorRoot = textarea.closest('.mp-editor-ground, .mp-editor, [class*="editor"]')
        ?? textarea.parentElement
      const toolbar = editorRoot?.querySelector<HTMLElement>('.mp-editor-menu, [role="toolbar"]')
        ?? editorRoot?.parentElement?.querySelector<HTMLElement>('.mp-editor-menu, [role="toolbar"]')
      if (!toolbar || toolbar.querySelector(`[data-exlg-editor-action="${options.id}"]`)) return
      const button = this.#document.createElement('button')
      button.type = 'button'
      button.className = 'exlg-next-editor-action'
      button.dataset.exlgEditorAction = options.id
      button.textContent = options.label
      button.title = options.title
      button.addEventListener('click', options.onClick)
      toolbar.append(button)
      buttons.add(button)
    }
    attach()
    const observer = new MutationObserver(() => {
      try { attach() }
      catch { /* editor temporarily absent during rebuild */ }
    })
    observer.observe(this.#document, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      for (const button of buttons) {
        button.removeEventListener('click', options.onClick)
        button.remove()
      }
      buttons.clear()
    }
  }
}

export function createLuoguEditorService(
  document: Document,
  options: { readonly timeoutMs?: number } = {},
): LuoguEditorService {
  return {
    waitForEditor({ signal }) {
      if (signal.aborted) return Promise.resolve(null)
      const immediate = findTextarea(document)
      if (immediate) return Promise.resolve(new DomEditorSession(document, immediate, editorKind(document.location.pathname)))
      return new Promise(resolve => {
        let settled = false
        const finish = (session: LuoguEditorSession | null): void => {
          if (settled) return
          settled = true
          observer.disconnect()
          clearTimeout(timeout)
          signal.removeEventListener('abort', abort)
          resolve(session)
        }
        const observer = new MutationObserver(() => {
          const textarea = findTextarea(document)
          if (textarea) finish(new DomEditorSession(document, textarea, editorKind(document.location.pathname)))
        })
        const abort = (): void => finish(null)
        const timeout = setTimeout(() => finish(null), options.timeoutMs ?? 5_000)
        observer.observe(document, { childList: true, subtree: true })
        signal.addEventListener('abort', abort, { once: true })
      })
    },
  }
}
