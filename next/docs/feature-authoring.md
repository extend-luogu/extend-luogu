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
    count: setting.number({
      title: '数量', default: 10, min: 1, max: 50, step: 1, integer: true,
    }),
    groups: setting.multiSelect({
      title: '分组', default: ['basic'],
      options: [
        { value: 'basic', label: '基础' },
        { value: 'extra', label: '扩展' },
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

The public schema supports `boolean`, `string`, `select`, `number`, and
`multiSelect`. `defineFeature` preserves the
schema's value types for `ctx.settings.get` and `set`. Reads merge defaults and
discard values with an invalid type, bound/step/integer rule, select option, or
multi-select option. Multi-select values are deduplicated and returned in the
schema option order; callers must treat returned arrays as immutable. Updating a control
in the shared Control Center persists the value and asks Kernel to remount the Feature,
so a refresh is unnecessary.

Control Center presentation remains fully declarative. A Feature may provide
titles, descriptions, category, capabilities, and declarative schema
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

## Network, navigation and text UI

Declare the matching capability before using a context service. Network calls
use a closed target plus a relative path:

```ts
const response = await ctx.network.request<unknown>('luogu', {
  path: '/problem/list',
  query: { page: 1, _contentOnly: 1 },
  responseType: 'json',
  signal: ctx.signal,
})
ctx.navigation.navigate('/problem/P1000')
ctx.ui.toast({ message: '操作完成', tone: 'success' })
```

A Feature cannot provide an origin or use `fetch`. External targets are limited
to the Host-defined Codeforces, AtCoder Problems, and CPH endpoints. Never put
Cookie, authorization, CSRF, editor text, notes, or private messages in headers,
bodies, logs, or diagnostics unless the specific local protocol requires the
non-sensitive body.

`NavigationService` is the only way for a Feature to navigate or open a page.
`FeatureUiService` accepts text only; it is intentionally not a second Control
Center or a general component system.

## Luogu editor and page data

Features that need site-specific data may import public types from
`@exlg/luogu` and declare `luogu.editor` or `luogu.page-data`. The editor adapter
owns selection/input events, toolbar rebuilds, and cleanup. The page-data adapter
returns only its documented sanitized summaries. Do not infer or request a full
`_feInjection`, Vue instance, CodeMirror instance, or page-world object.

Capability names currently include `dom`, `storage`, `clipboard`, `navigation`,
`ui`, the four `network.*` labels, `luogu.editor`, `luogu.page-data`, and
`luogu.private-messages`. They are metadata and audit inputs, not a substitute
for the source boundary checks.

## Forbidden access

Feature source must not access `window`, `document`, `unsafeWindow`, `GM_*`,
`chrome`, `browser`, `WebSocket`, `BroadcastChannel`, `fetch`, `_feInjection`,
`_feInstance`, jQuery, `eval`, or the `Function` constructor. It must not import
`@exlg/runtime/internal`, a host package, legacy `@exlg/core`, or old utilities.
The lint and boundary scripts enforce these rules. Ask for the smallest new
context capability only when a real Feature needs it. Relative imports are
resolved and must remain inside that Feature directory; `../../packages/...`
escapes are rejected even though they begin with `.`. Feature runtime source
must not contain complete external URLs.
