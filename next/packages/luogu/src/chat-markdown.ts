const maximumMessageLength = 20_000
const htmlNamespace = 'http://www.w3.org/1999/xhtml'
const allowedHtmlTags = new Set([
  'a', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'img', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead',
  'tr', 'ul',
])

function plainText(document: Document, source: string): DocumentFragment {
  const fragment = document.createDocumentFragment()
  fragment.append(document.createTextNode(source))
  return fragment
}

function safeHttpUrl(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  }
  catch {
    return null
  }
}

function unwrap(element: Element): void {
  element.replaceWith(...element.childNodes)
}

function restrictHtmlElement(element: Element, origin: string): void {
  const tag = element.localName
  if (!allowedHtmlTags.has(tag)) {
    unwrap(element)
    return
  }

  const preserved = new Map<string, string>()
  if (tag === 'a') {
    const href = element.getAttribute('href')
    const safeHref = href === null ? null : safeHttpUrl(href, origin)
    if (safeHref !== null) preserved.set('href', safeHref)
    const title = element.getAttribute('title')
    if (title !== null) preserved.set('title', title)
  }
  else if (tag === 'img') {
    const src = element.getAttribute('src')
    const safeSrc = src === null ? null : safeHttpUrl(src, origin)
    if (safeSrc === null) {
      element.replaceWith(element.ownerDocument.createTextNode(element.getAttribute('alt') ?? ''))
      return
    }
    preserved.set('src', safeSrc)
    preserved.set('alt', element.getAttribute('alt') ?? '')
    const title = element.getAttribute('title')
    if (title !== null) preserved.set('title', title)
  }
  else if (tag === 'span') {
    const classes = [...element.classList].filter(name => name === 'katex' || name === 'katex-display')
    if (classes.length > 0) preserved.set('class', classes.join(' '))
  }

  for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name)
  for (const [name, value] of preserved) element.setAttribute(name, value)

  if (tag === 'a' && preserved.has('href')) {
    element.setAttribute('target', '_blank')
    element.setAttribute('rel', 'noopener noreferrer')
  }
  else if (tag === 'img') {
    element.setAttribute('loading', 'lazy')
    element.setAttribute('decoding', 'async')
    element.setAttribute('referrerpolicy', 'no-referrer')
  }
}

function restrictFragment(fragment: DocumentFragment, origin: string): void {
  for (const element of [...fragment.querySelectorAll('*')]) {
    if (!element.isConnected && element.parentNode === null) continue
    if (element.namespaceURI === htmlNamespace) restrictHtmlElement(element, origin)
    else {
      for (const name of ['class', 'href', 'id', 'name', 'src', 'style']) element.removeAttribute(name)
    }
  }
}

export interface ChatMarkdownRenderer {
  readonly render: (source: string) => DocumentFragment
}

export async function createChatMarkdownRenderer(document: Document, origin: string): Promise<ChatMarkdownRenderer> {
  const view = document.defaultView
  if (view === null) throw new Error('Markdown rendering requires a browser window')

  const [{ default: createDOMPurify }, { Marked }, { default: markedKatex }] = await Promise.all([
    import('dompurify'),
    import('marked'),
    import('marked-katex-extension'),
  ])
  const parser = new Marked(
    { async: false, breaks: true, gfm: true },
    markedKatex({
      maxExpand: 1_000,
      maxSize: 10,
      nonStandard: true,
      output: 'mathml',
      strict: 'ignore',
      throwOnError: false,
      trust: false,
    }),
  )
  const purifier = createDOMPurify(view)
  const safeOrigin = new URL(origin).origin

  return {
    render(source) {
      if (source.length > maximumMessageLength) return plainText(document, source)
      try {
        const html = parser.parse(source, { async: false })
        const fragment = purifier.sanitize(html, {
          ADD_ATTR: ['encoding'],
          ADD_TAGS: ['annotation', 'semantics'],
          ALLOW_DATA_ATTR: false,
          ALLOW_UNKNOWN_PROTOCOLS: false,
          FORBID_ATTR: ['form', 'formaction', 'id', 'name', 'srcdoc', 'srcset', 'style'],
          FORBID_TAGS: [
            'audio', 'base', 'button', 'embed', 'form', 'iframe', 'input', 'link', 'meta', 'object',
            'option', 'picture', 'script', 'select', 'source', 'style', 'textarea', 'track', 'video',
          ],
          RETURN_DOM_FRAGMENT: true,
          USE_PROFILES: { html: true, mathMl: true },
        })
        restrictFragment(fragment, safeOrigin)
        return fragment
      }
      catch {
        return plainText(document, source)
      }
    },
  }
}
