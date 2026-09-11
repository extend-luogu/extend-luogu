import type { Cleanup } from '@exlg/runtime'
import { WindowEditorBridge } from './editor-bridge'

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

interface ToolbarButtonOptions {
  readonly id: string
  readonly label: string
  readonly title: string
  readonly onClick: () => void
}

const textareaSelectors = [
  '.mp-editor-ground textarea',
  '.CodeMirror-wrap textarea',
  'textarea[name="content"]',
  'textarea[name="description"]',
] as const

const codeMirrorSelectors = [
  '.casket .cm-editor',
  '.cs-editor .cm-editor',
  '.cm-editor',
] as const

let fallbackEditorId = 0

function findTextarea(document: Document): HTMLTextAreaElement | null {
  for (const selector of textareaSelectors) {
    const element = document.querySelector<HTMLTextAreaElement>(selector)
    if (element && !element.disabled) return element
  }
  return null
}

function findCodeMirrorEditor(document: Document): HTMLElement | null {
  for (const selector of codeMirrorSelectors) {
    for (const editor of document.querySelectorAll<HTMLElement>(selector)) {
      const content = editor.querySelector<HTMLElement>('.cm-content[contenteditable="true"]')
      if (content && editor.getAttribute('aria-disabled') !== 'true') return editor
    }
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

function observes(document: Document, callback: MutationCallback): MutationObserver {
  const Observer = document.defaultView?.MutationObserver ?? MutationObserver
  const observer = new Observer(callback)
  observer.observe(document, { childList: true, subtree: true })
  return observer
}

function hasToolbarAction(root: ParentNode, id: string): boolean {
  return [...root.querySelectorAll<HTMLElement>('[data-exlg-editor-action]')]
    .some(element => element.dataset.exlgEditorAction === id)
}

function nextEditorId(target: Window & typeof globalThis): string {
  if (typeof target.crypto.randomUUID === 'function') return `exlg-${target.crypto.randomUUID()}`
  fallbackEditorId += 1
  return `exlg-fallback-${target.Date.now()}-${fallbackEditorId}`
}

function ensureEditorId(root: HTMLElement, target: Window & typeof globalThis): string {
  const existing = root.dataset.exlgEditorId
  if (existing?.startsWith('exlg-') && existing.length <= 200) {
    const duplicate = [...root.ownerDocument.querySelectorAll<HTMLElement>('.cm-editor[data-exlg-editor-id]')]
      .some(candidate => candidate !== root && candidate.dataset.exlgEditorId === existing)
    if (!duplicate) return existing
  }

  let id = nextEditorId(target)
  const collides = (candidate: string): boolean => (
    [...root.ownerDocument.querySelectorAll<HTMLElement>('.cm-editor[data-exlg-editor-id]')]
      .some(editor => editor.dataset.exlgEditorId === candidate)
  )
  while (collides(id)) id = nextEditorId(target)
  root.dataset.exlgEditorId = id
  return id
}

class TextareaEditorSession implements LuoguEditorSession {
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

  mountToolbarButton(options: ToolbarButtonOptions): Cleanup {
    const buttons = new Set<HTMLButtonElement>()
    const attach = (): void => {
      const textarea = this.#textarea()
      const editorRoot = textarea.closest('.mp-editor-ground, .mp-editor, [class*="editor"]')
        ?? textarea.parentElement
      const toolbar = editorRoot?.querySelector<HTMLElement>('.mp-editor-menu, [role="toolbar"]')
        ?? editorRoot?.parentElement?.querySelector<HTMLElement>('.mp-editor-menu, [role="toolbar"]')
      if (!toolbar || hasToolbarAction(toolbar, options.id)) return
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
    const observer = observes(this.#document, () => {
      try { attach() }
      catch { /* editor temporarily absent during rebuild */ }
    })
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

class CodeMirrorEditorSession implements LuoguEditorSession {
  readonly kind: LuoguEditorKind
  readonly #bridge: WindowEditorBridge
  readonly #document: Document
  readonly #initial: HTMLElement
  readonly #target: Window & typeof globalThis

  constructor(
    target: Window & typeof globalThis,
    initial: HTMLElement,
    bridge: WindowEditorBridge,
    kind: LuoguEditorKind,
  ) {
    this.#target = target
    this.#document = target.document
    this.#initial = initial
    this.#bridge = bridge
    this.kind = kind
  }

  #editor(): HTMLElement {
    const editor = this.#initial.isConnected ? this.#initial : findCodeMirrorEditor(this.#document)
    if (!editor) throw new Error('Luogu editor is no longer available')
    return editor
  }

  #editorId(): string { return ensureEditorId(this.#editor(), this.#target) }

  async getValue(): Promise<string> {
    return (await this.#bridge.read(this.#editorId())).value
  }

  async setValue(value: string): Promise<void> {
    await this.#bridge.set(this.#editorId(), value)
  }

  async getSelection(): Promise<string> {
    const snapshot = await this.#bridge.read(this.#editorId())
    return snapshot.value.slice(snapshot.start, snapshot.end)
  }

  async getSelectionRange(): Promise<{ readonly start: number; readonly end: number }> {
    const snapshot = await this.#bridge.read(this.#editorId())
    return { start: snapshot.start, end: snapshot.end }
  }

  async insertText(text: string): Promise<void> { await this.replaceSelection(text) }

  async replaceSelection(text: string): Promise<void> {
    await this.#bridge.replaceSelection(this.#editorId(), text)
  }

  async replaceRange(start: number, end: number, text: string): Promise<void> {
    const safeStart = Math.max(0, start)
    const safeEnd = Math.max(safeStart, end)
    await this.#bridge.replaceRange(this.#editorId(), safeStart, safeEnd, text)
  }

  async focus(): Promise<void> { await this.#bridge.focus(this.#editorId()) }

  async submit(): Promise<void> {
    const editor = this.#editor()
    const form = editor.closest('form')
    if (form) {
      form.requestSubmit()
      return
    }
    const root = editor.closest('.casket, .cs-main, [class*="editor"]') ?? editor.parentElement
    root?.querySelector<HTMLButtonElement>('button[type="submit"], button[data-submit-code]')?.click()
  }

  listenKeydown(listener: (event: KeyboardEvent) => void): Cleanup {
    const accept = (event: KeyboardEvent): void => {
      try {
        const target = event.target
        if (target instanceof this.#target.Node && this.#editor().contains(target)) listener(event)
      }
      catch { /* editor temporarily absent during rebuild */ }
    }
    this.#document.addEventListener('keydown', accept)
    return () => this.#document.removeEventListener('keydown', accept)
  }

  mountToolbarButton(options: ToolbarButtonOptions): Cleanup {
    const mounts = new Map<HTMLButtonElement, HTMLElement>()
    const attach = (): void => {
      const editor = this.#editor()
      const root = editor.closest<HTMLElement>('.casket, .cs-main') ?? editor.parentElement
      const toolbar = root?.querySelector<HTMLElement>('.cs-toolbar')
      if (!toolbar || hasToolbarAction(toolbar, options.id)) return
      const firstChild = toolbar.firstElementChild
      const host = firstChild instanceof this.#target.HTMLElement ? firstChild : toolbar
      const group = this.#document.createElement('span')
      group.className = 'cs-toolbar-group exlg-next-editor-actions'
      group.style.marginInlineStart = '6px'
      const button = this.#document.createElement('button')
      button.type = 'button'
      button.className = 'cs-toolbar-tool exlg-next-editor-action'
      button.dataset.exlgEditorAction = options.id
      button.textContent = options.label
      button.title = options.title
      button.setAttribute('aria-label', options.title)
      button.style.appearance = 'none'
      button.style.background = 'transparent'
      button.style.border = '0'
      button.style.color = 'inherit'
      button.style.cursor = 'pointer'
      button.style.font = 'inherit'
      button.style.width = 'auto'
      button.addEventListener('click', options.onClick)
      group.append(button)
      host.append(group)
      mounts.set(button, group)
    }
    attach()
    const observer = observes(this.#document, () => {
      try { attach() }
      catch { /* editor temporarily absent during rebuild */ }
    })
    return () => {
      observer.disconnect()
      for (const [button, group] of mounts) {
        button.removeEventListener('click', options.onClick)
        group.remove()
      }
      mounts.clear()
    }
  }
}

export function createLuoguEditorService(
  document: Document,
  options: { readonly timeoutMs?: number; readonly bridgeTimeoutMs?: number } = {},
): LuoguEditorService {
  const target = document.defaultView
  const bridge = target ? new WindowEditorBridge(target, options.bridgeTimeoutMs) : null
  const currentSession = (): LuoguEditorSession | null => {
    const codeMirror = bridge ? findCodeMirrorEditor(document) : null
    if (codeMirror && target && bridge) {
      return new CodeMirrorEditorSession(target, codeMirror, bridge, editorKind(document.location.pathname))
    }
    const textarea = findTextarea(document)
    return textarea ? new TextareaEditorSession(document, textarea, editorKind(document.location.pathname)) : null
  }

  return {
    waitForEditor({ signal }) {
      if (signal.aborted) return Promise.resolve(null)
      const immediate = currentSession()
      if (immediate) return Promise.resolve(immediate)
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
        const observer = observes(document, () => {
          const session = currentSession()
          if (session) finish(session)
        })
        const abort = (): void => finish(null)
        const timeout = setTimeout(() => finish(null), options.timeoutMs ?? 5_000)
        signal.addEventListener('abort', abort, { once: true })
      })
    },
  }
}
