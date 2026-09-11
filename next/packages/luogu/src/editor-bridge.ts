import type { Cleanup } from '@exlg/runtime'

export const EDITOR_REQUEST_EVENT = 'exlg:vnext:editor-request'
export const EDITOR_RESPONSE_EVENT = 'exlg:vnext:editor-response'

export interface EditorSnapshot {
  readonly value: string
  readonly anchor: number
  readonly head: number
  readonly start: number
  readonly end: number
}

type EditorCommand =
  | { readonly editorId: string; readonly operation: 'read' | 'focus' }
  | { readonly editorId: string; readonly operation: 'set' | 'replaceSelection'; readonly text: string }
  | {
    readonly editorId: string
    readonly operation: 'replaceRange'
    readonly start: number
    readonly end: number
    readonly text: string
  }

interface CodeMirrorDocument {
  readonly length: number
  toString(): string
}

interface CodeMirrorSelection {
  readonly anchor: number
  readonly head: number
}

interface CodeMirrorEditorView {
  readonly state: {
    readonly doc: CodeMirrorDocument
    readonly selection: { readonly main: CodeMirrorSelection }
  }
  dispatch(specification: {
    readonly changes?: { readonly from: number; readonly to: number; readonly insert: string }
    readonly selection?: { readonly anchor: number; readonly head?: number }
    readonly scrollIntoView?: boolean
  }): void
  focus(): void
}

let fallbackRequestId = 0

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 200
}

function isPosition(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function findEditorView(document: Document, editorId: string): CodeMirrorEditorView | null {
  const roots = document.querySelectorAll<HTMLElement>('.cm-editor[data-exlg-editor-id]')
  for (const root of roots) {
    if (root.dataset.exlgEditorId !== editorId) continue
    const content = root.querySelector<HTMLElement>('.cm-content')
    if (!content) return null
    const holder = (content as unknown as { readonly cmView?: unknown }).cmView
    if (!isRecord(holder) || !isRecord(holder.view)) return null
    const view = holder.view
    if (typeof view.dispatch !== 'function' || typeof view.focus !== 'function') return null
    return view as unknown as CodeMirrorEditorView
  }
  return null
}

function readSnapshot(view: CodeMirrorEditorView): EditorSnapshot | null {
  const { doc, selection } = view.state
  const { anchor, head } = selection.main
  if (!Number.isSafeInteger(doc.length) || doc.length < 0 || !isPosition(anchor) || !isPosition(head)) return null
  const value = doc.toString()
  if (typeof value !== 'string') return null
  const safeAnchor = Math.min(anchor, value.length)
  const safeHead = Math.min(head, value.length)
  return {
    value,
    anchor: safeAnchor,
    head: safeHead,
    start: Math.min(safeAnchor, safeHead),
    end: Math.max(safeAnchor, safeHead),
  }
}

function replaceRange(
  view: CodeMirrorEditorView,
  snapshot: EditorSnapshot,
  start: number,
  end: number,
  text: string,
): void {
  const safeStart = Math.min(start, snapshot.value.length)
  const safeEnd = Math.max(safeStart, Math.min(end, snapshot.value.length))
  view.dispatch({
    changes: { from: safeStart, to: safeEnd, insert: text },
    selection: { anchor: safeStart + text.length },
    scrollIntoView: true,
  })
}

/** Installs the narrow page-world API needed to operate Luogu's CodeMirror 6 editor. */
export function installEditorBridge(target: Window & typeof globalThis): Cleanup {
  const respond = (requestId: string, ok: boolean, snapshot?: EditorSnapshot): void => {
    target.document.dispatchEvent(new target.CustomEvent(EDITOR_RESPONSE_EVENT, {
      detail: snapshot ? { requestId, ok, snapshot } : { requestId, ok },
    }))
  }

  const receive = (event: Event): void => {
    const detail = (event as CustomEvent<unknown>).detail
    if (!isRecord(detail) || !isIdentifier(detail.requestId)) return
    const { requestId } = detail
    if (!isIdentifier(detail.editorId) || typeof detail.operation !== 'string') {
      respond(requestId, false)
      return
    }

    try {
      const view = findEditorView(target.document, detail.editorId)
      if (!view) {
        respond(requestId, false)
        return
      }
      const snapshot = readSnapshot(view)
      if (!snapshot) {
        respond(requestId, false)
        return
      }

      switch (detail.operation) {
        case 'read':
          respond(requestId, true, snapshot)
          return
        case 'focus':
          view.focus()
          respond(requestId, true)
          return
        case 'set': {
          if (typeof detail.text !== 'string') break
          view.dispatch({
            changes: { from: 0, to: snapshot.value.length, insert: detail.text },
            selection: {
              anchor: Math.min(snapshot.anchor, detail.text.length),
              head: Math.min(snapshot.head, detail.text.length),
            },
            scrollIntoView: true,
          })
          respond(requestId, true)
          return
        }
        case 'replaceSelection':
          if (typeof detail.text !== 'string') break
          replaceRange(view, snapshot, snapshot.start, snapshot.end, detail.text)
          respond(requestId, true)
          return
        case 'replaceRange':
          if (!isPosition(detail.start) || !isPosition(detail.end) || typeof detail.text !== 'string') break
          replaceRange(view, snapshot, detail.start, detail.end, detail.text)
          respond(requestId, true)
          return
        default:
          break
      }
    }
    catch { /* page-owned editor objects are treated as unavailable */ }
    respond(requestId, false)
  }

  target.document.addEventListener(EDITOR_REQUEST_EVENT, receive)
  return () => target.document.removeEventListener(EDITOR_REQUEST_EVENT, receive)
}

function sanitizeSnapshot(value: unknown): EditorSnapshot | null {
  if (!isRecord(value) || typeof value.value !== 'string') return null
  if (!isPosition(value.anchor) || !isPosition(value.head)
    || !isPosition(value.start) || !isPosition(value.end)) return null
  if (value.anchor > value.value.length || value.head > value.value.length
    || value.start > value.end || value.end > value.value.length) return null
  return {
    value: value.value,
    anchor: value.anchor,
    head: value.head,
    start: value.start,
    end: value.end,
  }
}

function nextRequestId(target: Window & typeof globalThis): string {
  if (typeof target.crypto.randomUUID === 'function') return target.crypto.randomUUID()
  fallbackRequestId += 1
  return `fallback-${target.Date.now()}-${fallbackRequestId}`
}

export class WindowEditorBridge {
  readonly #target: Window & typeof globalThis
  readonly #timeoutMs: number

  constructor(target: Window & typeof globalThis, timeoutMs = 250) {
    this.#target = target
    this.#timeoutMs = timeoutMs
  }

  async read(editorId: string): Promise<EditorSnapshot> {
    const response = await this.#request({ editorId, operation: 'read' })
    const snapshot = sanitizeSnapshot(response.snapshot)
    if (!snapshot) throw new Error('Luogu editor returned an invalid snapshot')
    return snapshot
  }

  async set(editorId: string, text: string): Promise<void> {
    await this.#request({ editorId, operation: 'set', text })
  }

  async replaceSelection(editorId: string, text: string): Promise<void> {
    await this.#request({ editorId, operation: 'replaceSelection', text })
  }

  async replaceRange(editorId: string, start: number, end: number, text: string): Promise<void> {
    await this.#request({ editorId, operation: 'replaceRange', start, end, text })
  }

  async focus(editorId: string): Promise<void> {
    await this.#request({ editorId, operation: 'focus' })
  }

  #request(command: EditorCommand): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const requestId = nextRequestId(this.#target)
      let settled = false
      const finish = (result: Record<string, unknown> | Error): void => {
        if (settled) return
        settled = true
        cleanup()
        if (result instanceof Error) reject(result)
        else resolve(result)
      }
      const receive = (event: Event): void => {
        const detail = (event as CustomEvent<unknown>).detail
        if (!isRecord(detail) || detail.requestId !== requestId || typeof detail.ok !== 'boolean') return
        finish(detail.ok ? detail : new Error('Luogu editor bridge rejected the operation'))
      }
      const timeout = this.#target.setTimeout(() => {
        finish(new Error('Luogu editor bridge timed out'))
      }, this.#timeoutMs)
      const cleanup = (): void => {
        this.#target.clearTimeout(timeout)
        this.#target.document.removeEventListener(EDITOR_RESPONSE_EVENT, receive)
      }
      this.#target.document.addEventListener(EDITOR_RESPONSE_EVENT, receive)
      this.#target.document.dispatchEvent(new this.#target.CustomEvent(EDITOR_REQUEST_EVENT, {
        detail: { requestId, ...command },
      }))
    })
  }
}
