import type {
  FeatureConfirmOptions,
  FeaturePromptOptions,
  FeatureUiService,
  Scope,
} from '@exlg/runtime'

const styles = `
  :host { all: initial; font-family: system-ui, sans-serif; color-scheme: light dark; }
  *, *::before, *::after { box-sizing: border-box; }
  .toasts { display: grid; gap: 7px; left: 50%; pointer-events: none; position: fixed; top: 18px; transform: translateX(-50%); width: min(360px, calc(100vw - 24px)); z-index: 2147483300; }
  .toast { background: Canvas; border: 1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,.12); color: CanvasText; font-size: 13px; line-height: 1.4; padding: 9px 11px; }
  .toast[data-tone="success"] { border-inline-start: 3px solid #2f9e69; }
  .toast[data-tone="warning"] { border-inline-start: 3px solid #c78520; }
  .toast[data-tone="error"] { border-inline-start: 3px solid #d6455d; }
  .backdrop { align-items: center; background: rgba(10,14,22,.42); display: flex; inset: 0; justify-content: center; padding: 18px; position: fixed; z-index: 2147483350; }
  .dialog { background: Canvas; border: 1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius: 8px; box-shadow: 0 12px 36px rgba(0,0,0,.22); color: CanvasText; max-width: 420px; padding: 18px; width: 100%; }
  h2 { font-size: 17px; margin: 0; } p, label { font-size: 13px; line-height: 1.5; } p { color: color-mix(in srgb, CanvasText 72%, transparent); margin: 8px 0 0; }
  label { display: grid; gap: 6px; margin-top: 12px; }
  input { background: Canvas; border: 1px solid color-mix(in srgb, CanvasText 24%, transparent); border-radius: 5px; color: CanvasText; font: inherit; padding: 8px 9px; width: 100%; }
  .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  button { background: #5964c7; border: 1px solid #5964c7; border-radius: 5px; color: #fff; cursor: pointer; font: 600 12px system-ui, sans-serif; padding: 7px 11px; }
  button.secondary { background: transparent; border-color: color-mix(in srgb, CanvasText 24%, transparent); color: CanvasText; }
  button:focus-visible, input:focus-visible { outline: 2px solid #727be0; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
`

export function createFeatureUiService(document: Document, scope: Scope): FeatureUiService {
  const host = document.createElement('div')
  host.className = 'exlg-next-feature-ui-host'
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = styles
  const toasts = document.createElement('section')
  toasts.className = 'toasts'
  toasts.setAttribute('aria-live', 'polite')
  shadow.append(style, toasts)
  const attach = (): void => {
    const target = document.body ?? document.documentElement
    if (target && !host.isConnected && !scope.disposed) target.append(host)
  }
  attach()
  if (!host.isConnected) {
    document.addEventListener('DOMContentLoaded', attach, { once: true })
    scope.add(() => document.removeEventListener('DOMContentLoaded', attach))
  }
  let cancelModal: (() => void) | undefined
  scope.add(() => {
    cancelModal?.()
    host.remove()
  })

  const showModal = <T>(options: {
    readonly title: string
    readonly description?: string
    readonly input?: FeaturePromptOptions
    readonly confirmLabel?: string
    readonly cancelValue: T
    readonly accept: (input: HTMLInputElement | undefined) => T
  }): Promise<T> => new Promise(resolve => {
    cancelModal?.()
    let settled = false
    const previousFocus = shadow.activeElement instanceof HTMLElement
      ? shadow.activeElement
      : document.activeElement instanceof HTMLElement ? document.activeElement : null
    const backdrop = document.createElement('div')
    backdrop.className = 'backdrop'
    const dialog = document.createElement('section')
    dialog.className = 'dialog'
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.tabIndex = -1
    const title = document.createElement('h2')
    title.textContent = options.title
    dialog.append(title)
    if (options.description) {
      const description = document.createElement('p')
      description.textContent = options.description
      dialog.append(description)
    }
    let input: HTMLInputElement | undefined
    if (options.input) {
      const label = document.createElement('label')
      const labelText = document.createElement('span')
      labelText.textContent = options.input.label
      input = document.createElement('input')
      input.value = options.input.initialValue ?? ''
      if (options.input.maxLength !== undefined) input.maxLength = options.input.maxLength
      label.append(labelText, input)
      dialog.append(label)
    }
    const actions = document.createElement('div')
    actions.className = 'actions'
    const cancel = document.createElement('button')
    cancel.className = 'secondary'
    cancel.type = 'button'
    cancel.textContent = '取消'
    const confirm = document.createElement('button')
    confirm.type = 'button'
    confirm.textContent = options.confirmLabel ?? '确定'
    actions.append(cancel, confirm)
    dialog.append(actions)
    backdrop.append(dialog)
    shadow.append(backdrop)

    const finish = (value: T): void => {
      if (settled) return
      settled = true
      backdrop.remove()
      if (cancelModal === cancelCurrent) cancelModal = undefined
      previousFocus?.focus()
      resolve(value)
    }
    const cancelCurrent = (): void => finish(options.cancelValue)
    cancelModal = cancelCurrent
    cancel.addEventListener('click', cancelCurrent)
    confirm.addEventListener('click', () => finish(options.accept(input)))
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) cancelCurrent()
    })
    backdrop.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelCurrent()
        return
      }
      if (event.key === 'Enter' && event.target === input) {
        event.preventDefault()
        finish(options.accept(input))
        return
      }
      if (event.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll<HTMLElement>('input,button:not([disabled])')]
        const first = focusable[0]
        const last = focusable.at(-1)
        if (!first || !last) return
        if (event.shiftKey && shadow.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && shadow.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    })
    ;(input ?? dialog).focus()
  })

  return {
    toast(options) {
      if (scope.disposed) return
      const node = document.createElement('div')
      node.className = 'toast'
      node.dataset.tone = options.tone ?? 'neutral'
      node.textContent = options.message
      toasts.append(node)
      const timer = setTimeout(() => node.remove(), options.durationMs ?? 2_500)
      scope.add(() => {
        clearTimeout(timer)
        node.remove()
      })
    },
    confirm(options: FeatureConfirmOptions) {
      if (scope.disposed) return Promise.resolve(false)
      return showModal({
        title: options.title,
        description: options.description,
        ...(options.confirmLabel === undefined ? {} : { confirmLabel: options.confirmLabel }),
        cancelValue: false,
        accept: () => true,
      })
    },
    prompt(options: FeaturePromptOptions) {
      if (scope.disposed) return Promise.resolve(null)
      return showModal({
        title: options.title,
        input: options,
        cancelValue: null,
        accept: input => input?.value ?? '',
      })
    },
  }
}
