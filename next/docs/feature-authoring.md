# Authoring an ExLG Next feature

Every Feature imports the public `@exlg/runtime` API and is registered in
`features/catalog.ts`. A Feature that uses a narrow site adapter may additionally
import its public feature-facing types from `@exlg/luogu`; implementation and
host exports remain forbidden.

```ts
import { defineFeature, setting } from '@exlg/runtime'

export default defineFeature({
  id: 'official.example',
  apiVersion: 1,
  title: '示例功能',
  description: '展示 Feature 的最小结构。',
  category: 'reading',
  defaultEnabled: true,
  matches: route => route.kind === 'problem',
  capabilities: ['dom', 'storage'],
  settings: {
    enabledHint: setting.boolean({ title: '显示提示', default: true }),
    label: setting.string({ title: '文字', default: '示例' }),
    position: setting.select({
      title: '位置',
      default: 'top',
      options: [
        { value: 'top', label: '顶部' },
        { value: 'bottom', label: '底部' },
      ],
    }),
  },
  activate(ctx) {
    ctx.log.info('功能已启用')
  },
  async mount(ctx) {
    const label = await ctx.settings.get('label') // inferred as string
    const node = ctx.dom.create('button', { text: label })
    ctx.dom.observe('body', body => ctx.dom.mount(body, node))
  },
})
```

## Settings

The MVP supports `boolean`, `string`, and `select`. `defineFeature` preserves the
schema's value types for `ctx.settings.get` and `set`. Reads merge defaults and
discard values with an invalid type or invalid select option. Updating a control
in the shared Control Center persists the value and asks Kernel to remount the Feature,
so a refresh is unnecessary.

Control Center presentation remains fully declarative. A Feature may provide
titles, descriptions, category, capabilities, and boolean/string/select schema
metadata, but cannot provide Preact components, JSX, custom pages, commands, or
arbitrary management callbacks.

## activate and mount

`activate` runs once for an enabled Feature and owns resources that should live
across route changes. `mount` runs for each matching route key and receives
`ctx.route`. Both hooks may be async and may return one Cleanup. There is no
`unload`, `destroy`, or route-leave hook.

Use `ctx.signal` to stop optional asynchronous work early. Correctness must not
depend on the hook seeing the abort: a late returned Cleanup is still executed by
the disposed Scope.

## Scope-bound DOM

`ctx.dom.mount`, `listen`, `style`, and `observe` register their own cleanup in
the current Scope. Feature code must not add those disposers itself. `observe`
visits existing matches, watches dynamic insertions through the shared observer,
and uses a registration-local WeakSet to avoid duplicates.

Use `ctx.scope.add` for a resource that is not owned by a provided scoped
service. Cleanup may be async. It must tolerate being called after partial setup;
Scope makes the call idempotent and continues cleaning other resources if it
throws.

## Storage

`ctx.storage` is permanently namespaced to the current Feature. It supports
JSON-serializable values through `get`, `set`, `delete`, and `update`. A Feature
cannot name or obtain another Feature's namespace. Settings and enabled state use
separate storage keys and are not business data.

## Forbidden access

Feature source must not access `window`, `document`, `unsafeWindow`, `GM_*`,
`chrome`, `browser`, `WebSocket`, `BroadcastChannel`, `fetch`, `_feInjection`,
`_feInstance`, jQuery, `eval`, or the `Function` constructor. It must not import
`@exlg/runtime/internal`, a host package, legacy `@exlg/core`, or old utilities.
The lint and boundary scripts enforce these rules. Ask for the smallest new
context capability only when a real Feature needs it.
