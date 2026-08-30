import type {
  DomObserveOptions,
  Scope,
  ScopedDomService,
} from '@exlg/runtime'

interface Observation {
  readonly selector: string
  readonly callback: (element: Element) => void
  readonly root: ParentNode
  readonly seen: WeakSet<Element>
  readonly attributes: boolean
}

export class DomObserverHub {
  readonly #document: Document
  readonly #observer: MutationObserver
  readonly #observations = new Set<Observation>()
  readonly #onError: (error: unknown) => void
  #observingAttributes = false

  constructor(document: Document, onError: (error: unknown) => void = console.error) {
    this.#document = document
    this.#onError = onError
    this.#observer = new MutationObserver(records => this.#accept(records))
  }

  register<ElementType extends Element>(
    scope: Scope,
    selector: string,
    callback: (element: ElementType) => void,
    options: DomObserveOptions = {},
  ): void {
    if (scope.disposed) return
    const observation: Observation = {
      selector,
      callback: element => callback(element as ElementType),
      root: options.root ?? this.#document,
      seen: new WeakSet(),
      attributes: options.attributes ?? false,
    }
    this.#observations.add(observation)
    this.#scan(observation, observation.root)
    this.#refreshObserver()
    scope.add(() => {
      this.#observations.delete(observation)
      this.#refreshObserver()
    })
  }

  #refreshObserver(): void {
    this.#observer.disconnect()
    if (this.#observations.size === 0) return
    this.#observingAttributes = [...this.#observations].some(item => item.attributes)
    this.#observer.observe(this.#document, {
      childList: true,
      subtree: true,
      attributes: this.#observingAttributes,
    })
  }

  #accept(records: readonly MutationRecord[]): void {
    for (const observation of this.#observations) {
      for (const record of records) {
        if (record.type === 'attributes' && observation.attributes) {
          this.#scan(observation, record.target)
        }
        for (const node of record.addedNodes) this.#scan(observation, node)
      }
    }
  }

  #scan(observation: Observation, node: Node | ParentNode): void {
    if (!this.#isInsideRoot(observation.root, node)) return
    if (node instanceof Element) this.#visit(observation, node)
    if ('querySelectorAll' in node) {
      for (const element of node.querySelectorAll(observation.selector)) {
        this.#visit(observation, element)
      }
    }
  }

  #visit(observation: Observation, element: Element): void {
    if (!element.matches(observation.selector) || observation.seen.has(element)) return
    observation.seen.add(element)
    try {
      observation.callback(element)
    }
    catch (error) {
      this.#onError(error)
    }
  }

  #isInsideRoot(root: ParentNode, node: Node | ParentNode): boolean {
    if (root === this.#document) return true
    if (root === node) return true
    return node instanceof Node && root instanceof Node && root.contains(node)
  }
}

export interface DomEnvironment {
  readonly document: Document
  readonly observerHub: DomObserverHub
}

export function createDomEnvironment(
  document: Document,
  onError?: (error: unknown) => void,
): DomEnvironment {
  return {
    document,
    observerHub: new DomObserverHub(document, onError),
  }
}

export function createScopedDomService(
  environment: DomEnvironment,
  scope: Scope,
): ScopedDomService {
  const { document, observerHub } = environment
  return {
    query(selector, root = document) {
      return root.querySelector(selector)
    },
    queryAll(selector, root = document) {
      return [...root.querySelectorAll(selector)] as never
    },
    create(tag, options = {}) {
      const element = document.createElement(tag)
      if (options.className !== undefined) element.className = options.className
      if (options.text !== undefined) element.textContent = options.text
      if (options.attributes) {
        for (const [name, value] of Object.entries(options.attributes)) {
          element.setAttribute(name, value)
        }
      }
      return element
    },
    mount(parent, node, position = 'append') {
      const resolved = typeof parent === 'string' ? document.querySelector(parent) : parent
      if (!resolved) throw new Error(`DOM mount target not found: ${String(parent)}`)
      if (position === 'prepend') resolved.prepend(node)
      else resolved.append(node)
      scope.add(() => {
        node.parentNode?.removeChild(node)
      })
    },
    listen(target, event, listener, options) {
      target.addEventListener(event, listener, options)
      scope.add(() => target.removeEventListener(event, listener, options))
    },
    style(css) {
      const element = document.createElement('style')
      element.textContent = css
      const attach = (): void => {
        const target = document.head ?? document.documentElement
        if (target && !element.isConnected && !scope.disposed) target.append(element)
      }
      attach()
      if (!element.isConnected) {
        document.addEventListener('DOMContentLoaded', attach, { once: true })
        scope.add(() => document.removeEventListener('DOMContentLoaded', attach))
      }
      scope.add(() => element.remove())
      return element
    },
    observe(selector, callback, options) {
      observerHub.register(scope, selector, callback, options)
    },
    getSelectionText() {
      return document.getSelection()?.toString() ?? ''
    },
    isEditableTarget(target) {
      if (!(target instanceof Element)) return false
      return target.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
        || target.closest('[contenteditable]:not([contenteditable="false"])') !== null
    },
  }
}
