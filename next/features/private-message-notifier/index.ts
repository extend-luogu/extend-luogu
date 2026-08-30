import type {
  LuoguFeatureContextExtension,
  LuoguPrivateMessage,
} from '@exlg/luogu'
import { defineFeature, setting } from '@exlg/runtime'
import { createPrivateMessageRenderer } from './renderer'

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
    const renderer = createPrivateMessageRenderer({
      dom: ctx.dom,
      origin: ctx.route.url.origin,
      showPreview: values.showPreview,
      maxVisible: visibleLimits[values.maxVisible],
      dismissAfter: dismissMilliseconds[values.dismissAfter],
    })
    currentSinks.add(renderer.notify)
    return () => {
      currentSinks.delete(renderer.notify)
      renderer.dispose()
    }
  },
})
