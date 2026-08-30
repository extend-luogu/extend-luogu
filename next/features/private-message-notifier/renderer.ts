import type { LuoguPrivateMessage } from '@exlg/luogu'
import type { ScopedDomService } from '@exlg/runtime'
import notifierStyles from './styles.css?inline'

interface RendererOptions {
  readonly dom: ScopedDomService
  readonly origin: string
  readonly showPreview: boolean
  readonly maxVisible: number
  readonly dismissAfter: number
}

interface RenderedCard {
  readonly node: HTMLElement
  readonly timer?: ReturnType<typeof setTimeout>
}

export interface PrivateMessageRenderer {
  readonly notify: (message: LuoguPrivateMessage) => void
  readonly dispose: () => void
}

function senderInitial(name: string): string {
  return Array.from(name.trim())[0]?.toLocaleUpperCase() ?? '?'
}

export function createPrivateMessageRenderer(options: RendererOptions): PrivateMessageRenderer {
  const { dom } = options
  const cards = new Map<number, RenderedCard>()
  const order: number[] = []
  let disposed = false

  const host = dom.create('div', { className: 'exlg-next-private-messages-host' })
  const shadow = host.attachShadow({ mode: 'open' })
  const style = dom.create('style', { text: notifierStyles })
  const container = dom.create('section', {
    className: 'notification-stack',
    attributes: {
      'aria-label': '站内私信提醒',
      'aria-live': 'polite',
      'aria-relevant': 'additions',
    },
  })
  dom.mount(shadow, style)
  dom.mount(shadow, container)
  dom.observe('body', body => {
    if (!host.isConnected) dom.mount(body, host)
  })

  const remove = (id: number): void => {
    const card = cards.get(id)
    if (!card) return
    if (card.timer !== undefined) clearTimeout(card.timer)
    card.node.remove()
    cards.delete(id)
    const index = order.indexOf(id)
    if (index >= 0) order.splice(index, 1)
  }

  dom.listen(container, 'click', event => {
    if (!(event.target instanceof Element)) return
    const control = event.target.closest<HTMLElement>('[data-dismiss-id]')
    if (!control || !container.contains(control)) return
    const id = Number(control.dataset.dismissId)
    if (Number.isSafeInteger(id)) remove(id)
  })

  dom.listen(container, 'error', event => {
    if (!(event.target instanceof Element) || !event.target.matches('img.avatar')) return
    event.target.setAttribute('hidden', '')
    event.target.parentElement?.classList.add('avatar-link--fallback')
  }, true)

  const notify = (message: LuoguPrivateMessage): void => {
    if (disposed) return
    if (cards.has(message.id)) remove(message.id)
    while (order.length >= options.maxVisible) remove(order[0]!)

    const profileUrl = new URL(`/user/${message.sender.uid}`, options.origin).href
    const card = dom.create('article', {
      className: 'notification-card',
      attributes: {
        'aria-label': `来自 ${message.sender.name} 的新私信`,
        'data-message-id': String(message.id),
      },
    })
    const avatarLink = dom.create('a', {
      className: 'avatar-link',
      attributes: {
        'aria-label': `查看 ${message.sender.name} 的个人主页`,
        href: profileUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    })
    const avatarFallback = dom.create('span', {
      className: 'avatar-fallback',
      text: senderInitial(message.sender.name),
      attributes: { 'aria-hidden': 'true' },
    })
    const avatar = dom.create('img', {
      className: 'avatar',
      attributes: {
        src: `https://cdn.luogu.com.cn/upload/usericon/${message.sender.uid}.png`,
        alt: `${message.sender.name} 的头像`,
        decoding: 'async',
        loading: 'lazy',
        referrerpolicy: 'no-referrer',
      },
    })
    avatarLink.append(avatarFallback, avatar)

    const content = dom.create('div', { className: 'notification-content' })
    const header = dom.create('div', { className: 'notification-header' })
    const identity = dom.create('div', { className: 'identity' })
    const name = dom.create('a', {
      className: 'sender-name',
      text: message.sender.name,
      attributes: {
        href: profileUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    })
    const meta = dom.create('div', { className: 'message-meta' })
    const type = dom.create('span', { className: 'message-type', text: '私信' })
    const received = dom.create('span', { className: 'received-label', text: '刚刚收到' })
    meta.append(type, received)
    identity.append(name, meta)
    const close = dom.create('button', {
      className: 'close-button',
      attributes: {
        type: 'button',
        'aria-label': `关闭来自 ${message.sender.name} 的私信提醒`,
        'data-dismiss-id': String(message.id),
      },
    })
    header.append(identity, close)

    const preview = dom.create('p', {
      className: 'message-preview',
      text: options.showPreview ? message.content : '收到一条新私信',
    })
    const actions = dom.create('div', { className: 'notification-actions' })
    const view = dom.create('a', {
      className: 'view-message',
      text: '查看私信',
      attributes: {
        href: new URL('/chat', options.origin).href,
        target: '_blank',
        rel: 'noopener noreferrer',
        'data-dismiss-id': String(message.id),
      },
    })
    actions.append(view)
    content.append(header, preview, actions)
    card.append(avatarLink, content)

    container.append(card)
    container.scrollTop = container.scrollHeight
    order.push(message.id)
    const timer = options.dismissAfter === 0
      ? undefined
      : setTimeout(() => remove(message.id), options.dismissAfter)
    cards.set(message.id, { node: card, ...(timer === undefined ? {} : { timer }) })
  }

  const dispose = (): void => {
    if (disposed) return
    disposed = true
    for (const id of [...order]) remove(id)
    host.remove()
  }

  return { notify, dispose }
}
