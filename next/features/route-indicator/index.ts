import { defineFeature } from '@exlg/runtime'

export default defineFeature({
  id: 'official.route-indicator',
  apiVersion: 1,
  title: '路由诊断标记',
  description: '显示 Kernel 当前收到的 route.kind 与 route.key。',
  category: 'diagnostics',
  defaultEnabled: false,
  matches: () => true,
  capabilities: ['dom'],
  settings: {},
  mount(ctx) {
    const indicator = ctx.dom.create('output', {
      className: 'exlg-next-route-indicator',
      text: `${ctx.route.kind} · ${ctx.route.key}`,
      attributes: { 'aria-label': 'ExLG 当前路由' },
    })
    ctx.dom.style(`
      .exlg-next-route-indicator {
        background: #0f172a; border-radius: 5px; bottom: 8px; color: #e2e8f0;
        font: 11px/1.4 ui-monospace, monospace; left: 8px; max-width: 70vw;
        overflow: hidden; padding: 5px 8px; position: fixed; text-overflow: ellipsis;
        white-space: nowrap; z-index: 2147482999;
      }
    `)
    ctx.dom.observe('body', body => {
      if (!indicator.isConnected) ctx.dom.mount(body, indicator)
    })
  },
})
