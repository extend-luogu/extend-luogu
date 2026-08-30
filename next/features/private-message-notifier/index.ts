import type {
  LuoguFeatureContextExtension,
  LuoguPrivateMessage,
} from '@exlg/luogu'
import { defineFeature, setting } from '@exlg/runtime'

const settings = {
  dismissAfter: setting.select({
    title: '自动消失时间',
    default: '30',
    options: [
      { value: '0', label: '不自动消失' },
      { value: '5', label: '5 秒' },
      { value: '10', label: '10 秒' },
      { value: '30', label: '30 秒' },
      { value: '60', label: '60 秒' },
    ],
  }),
  showPreview: setting.boolean({
    title: '显示内容预览',
    default: true,
  }),
  maxVisible: setting.select({
    title: '最多同时显示',
    default: '5',
    options: [
      { value: '3', label: '3 条' },
      { value: '5', label: '5 条' },
      { value: '8', label: '8 条' },
    ],
  }),
} as const

type MessageSink = (message: LuoguPrivateMessage) => void
let activeSinks: Set<MessageSink> | undefined

const dismissMilliseconds = {
  '0': 0,
  '5': 5_000,
  '10': 10_000,
  '30': 30_000,
  '60': 60_000,
} as const

const visibleLimits = { '3': 3, '5': 5, '8': 8 } as const

export default defineFeature<typeof settings, LuoguFeatureContextExtension>({
  id: 'official.private-message-notifier',
  apiVersion: 1,
  title: '站内私信提醒',
  description: '在浏览洛谷其他页面时显示收到的新私信',
  category: 'communication',
  defaultEnabled: false,
  matches: () => true,
  capabilities: ['dom', 'luogu.private-messages'],
  settings,
  async activate(ctx) {
    const sinks = new Set<MessageSink>()
    activeSinks = sinks
    const unsubscribe = await ctx.luogu.privateMessages.subscribe(message => {
      for (const sink of [...sinks]) {
        try { sink(message) }
        catch { ctx.log.warn('私信提醒渲染器拒绝了一条已验证消息') }
      }
    }, { signal: ctx.signal })
    return async () => {
      await unsubscribe()
      sinks.clear()
      if (activeSinks === sinks) activeSinks = undefined
    }
  },
  async mount(ctx) {
    if (ctx.route.kind === 'chat') return
    const currentSinks = activeSinks
    if (!currentSinks) return
    const values = await ctx.settings.getAll()
    const maxVisible = visibleLimits[values.maxVisible]
    const dismissAfter = dismissMilliseconds[values.dismissAfter]
    const cards = new Map<number, { readonly node: HTMLElement; readonly timer?: ReturnType<typeof setTimeout> }>()
    const order: number[] = []

    const host = ctx.dom.create('div', { className: 'exlg-next-private-messages-host' })
    const shadow = host.attachShadow({ mode: 'open' })
    const style = ctx.dom.create('style', { text: `
      :host { all: initial; color-scheme: light; }
      *, *::before, *::after { box-sizing: border-box; }
      .stack {
        bottom: 92px; display: grid; gap: 10px; position: fixed; right: 16px;
        width: min(340px, calc(100vw - 32px)); z-index: 2147483200;
      }
      .card {
        background: #fff; border: 1px solid #dbe3ed; border-radius: 10px;
        box-shadow: 0 10px 32px rgba(15, 23, 42, .2); color: #172033;
        display: grid; font: 13px/1.45 system-ui, sans-serif;
        gap: 3px 10px; grid-template-columns: 44px 1fr auto; padding: 11px;
      }
      .avatar-link { grid-row: 1 / span 3; }
      .avatar { border-radius: 50%; display: block; height: 44px; object-fit: cover; width: 44px; }
      .name { color: #1d4ed8; font-weight: 700; overflow: hidden; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
      .preview { color: #334155; grid-column: 2 / 4; margin: 0; overflow: hidden; overflow-wrap: anywhere; }
      .footer { align-items: center; display: flex; grid-column: 2 / 4; justify-content: space-between; margin-top: 4px; }
      .type { color: #94a3b8; font-size: 11px; }
      .view { background: #eff6ff; border-radius: 5px; color: #1d4ed8; padding: 3px 9px; text-decoration: none; }
      .close { appearance: none; background: #f1f5f9; border: 0; border-radius: 50%; color: #475569; cursor: pointer; height: 24px; padding: 0; width: 24px; }
      .close:focus-visible, .view:focus-visible, .name:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
    ` })
    const container = ctx.dom.create('section', {
      className: 'stack',
      attributes: { 'aria-label': '站内私信提醒', 'aria-live': 'polite' },
    })
    ctx.dom.mount(shadow, style)
    ctx.dom.mount(shadow, container)
    ctx.dom.observe('body', body => {
      if (!host.isConnected) ctx.dom.mount(body, host)
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

    ctx.dom.listen(container, 'click', event => {
      if (!(event.target instanceof Element)) return
      const control = event.target.closest<HTMLElement>('[data-dismiss-id]')
      const id = control?.dataset.dismissId
      if (id !== undefined) remove(Number(id))
    })

    const render = (message: LuoguPrivateMessage): void => {
      while (order.length >= maxVisible) remove(order[0]!)
      const card = ctx.dom.create('article', {
        className: 'card',
        attributes: { 'data-message-id': String(message.id) },
      })
      const avatarLink = ctx.dom.create('a', {
        className: 'avatar-link',
        attributes: {
          href: new URL(`/user/${message.sender.uid}`, ctx.route.url.origin).href,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      })
      const avatar = ctx.dom.create('img', {
        className: 'avatar',
        attributes: {
          src: `https://cdn.luogu.com.cn/upload/usericon/${message.sender.uid}.png`,
          alt: `${message.sender.name} 的头像`,
        },
      })
      avatarLink.append(avatar)
      const name = ctx.dom.create('a', {
        className: 'name',
        text: message.sender.name,
        attributes: {
          href: new URL(`/user/${message.sender.uid}`, ctx.route.url.origin).href,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      })
      const close = ctx.dom.create('button', {
        className: 'close',
        text: '×',
        attributes: {
          type: 'button',
          'aria-label': `关闭来自 ${message.sender.name} 的私信提醒`,
          'data-dismiss-id': String(message.id),
        },
      })
      const preview = ctx.dom.create('p', {
        className: 'preview',
        text: values.showPreview ? message.content : '收到一条新私信',
      })
      const footer = ctx.dom.create('div', { className: 'footer' })
      const type = ctx.dom.create('span', { className: 'type', text: '私信' })
      const view = ctx.dom.create('a', {
        className: 'view',
        text: '查看',
        attributes: {
          href: new URL('/chat', ctx.route.url.origin).href,
          target: '_blank',
          rel: 'noopener noreferrer',
          'data-dismiss-id': String(message.id),
        },
      })
      footer.append(type, view)
      card.append(avatarLink, name, close, preview, footer)
      container.append(card)
      order.push(message.id)
      const timer = dismissAfter === 0
        ? undefined
        : setTimeout(() => remove(message.id), dismissAfter)
      cards.set(message.id, { node: card, ...(timer === undefined ? {} : { timer }) })
    }

    currentSinks.add(render)
    return () => {
      currentSinks.delete(render)
      for (const id of [...order]) remove(id)
    }
  },
})
