# ExLG Next Control Center v1

## System application boundary

Control Center is mounted once by each Host beside Kernel. It is not listed in
the Feature Catalog and cannot be disabled, because it is the recovery surface
for disabled or failed Features. Kernel remains unaware of Preact, DOM, search,
forms, imports, downloads, and UI preferences.

Both products mount the same `@exlg/control-center` package inside an open
Shadow Root. Preact and local SVG icons are private implementation details; no
framework object or mutable management API is attached to `window`.

## Pages

- **总览** derives counts from Catalog and Kernel status, and shows only Host,
  version, route kind, and pathname.
- **功能** searches declarative metadata and filters category/status. Details
  expose schema-generated settings plus retry, remount, and settings reset.
- **数据** exports, previews, and merge-imports enabled state and settings.
- **诊断** displays current status plus an in-memory ring of at most 20 observed
  errors and produces a sanitized local report.
- **面板设置** stores theme, density, Launcher side, and the last primary view.

Internal navigation never modifies the Luogu URL. Feature detail is a transient
view stack entry and is not persisted.

The five primary destinations use a full-width horizontal tab strip so the
narrow drawer does not reserve a permanent text column. Feature rows encode
status with a compact color dot and leading border while retaining hidden
accessible status text. The edge Launcher has a fixed, centered compact mark;
its hidden letters take no layout space and expand only on pointer hover.

## Management interfaces

`mountControlCenter` receives `FeatureMetadata[]`, `KernelController`, the
shared `RouteSource`, `FeatureConfigurationController`, a dedicated
`ControlCenterPreferencesStore`, clipboard, and Host/version metadata. It does
not receive a raw key-value store, Feature business-data access, FeatureContext,
Luogu session/private-message services, WebSocket, cross-tab coordinator, or
MAIN-world bridge.

The browser package owns one validated configuration controller used by both
`FeatureContext.settings` and Control Center. It merges defaults, rejects bad
types and invalid select values, batches `setMany` into one settings write, and
resets only `exlg:vnext:settings:<feature-id>`. Feature business data under
`exlg:vnext:data:<feature-id>` is outside this interface.

## Save and concurrency behavior

Boolean, select, and multi-select settings save immediately. String and number
drafts save on blur or Enter. Number controls expose declared min/max/step rules;
multi-select controls are semantic checkbox groups and save one stable array.
An enabled Feature is remounted after a successful save; a disabled
Feature remains disabled. Per-setting generations prevent stale completions
from overwriting newer UI state, and detail loads are generation-guarded.
Import is single-flight and batches each Feature's settings before at most one
remount.

## Configuration format

```json
{
  "format": "exlg-next-configuration",
  "version": 1,
  "appVersion": "0.1.0",
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "features": {
    "official.example": {
      "enabled": true,
      "settings": {
        "label": "示例",
        "visible": true,
        "count": 10,
        "groups": ["basic", "extra"]
      }
    }
  }
}
```

Imports are limited to 1 MiB and use merge semantics. Pure validation accepts
only the current format/version, known Catalog IDs, known setting names, correct
boolean/string/number/array types, declared bounds, and declared select or
multi-select options. Prototype-pollution keys are
rejected. A preview reports updates and ignored entries before explicit user
confirmation. A failed Feature does not prevent other planned Features from
being applied.

The format explicitly excludes Feature data, problem notes, private messages,
deduplication state, logs, Control Center preferences, cookies, and login data.

## Diagnostics privacy

The copied report contains app version, Host type, route kind, pathname, Feature
ID/status, and sanitized `lastError` only. It removes control characters,
redacts URL query/hash, flattens line breaks, truncates errors, and excludes
settings values, route query/hash, UID/name, private-message/note content,
Feature data, cookies, CSRF, tokens, WebSocket frames, and full stacks. Reports
remain local and use the injected clipboard service; there is no upload path.

## Lifecycle and accessibility

The mount cleanup aborts outstanding UI loads, unsubscribes Kernel and route
listeners, removes keyboard handlers, unmounts Preact, and removes the Shadow
host. It is idempotent. Object URLs used for download are revoked immediately.

The Launcher exposes expanded state. The drawer is an aria-modal dialog with
focus entry/restoration, Escape/backdrop close, a basic Tab trap, semantic form
controls, live result regions, `Alt+Shift+E`, and Ctrl/Cmd+K search focus. CSS is
scoped to the Shadow Root with light/dark/system themes, two densities, left or
right placement, responsive full-screen layout, and reduced-motion support.

## No Market or custom Feature UI

The functions page is the official build-time Catalog, not an installed-module
market. Control Center cannot download, install, uninstall, or execute code.
Features cannot inject arbitrary Preact components, views, slots, or commands;
their entire management surface is declarative metadata and settings schema.
