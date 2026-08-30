# ExLG Next MVP architecture

## Lightweight kernel boundary

`@exlg/runtime` owns only the static feature catalog contract, enabled state
coordination, feature lifecycle, route coordination, Scope ownership, status,
and local error diagnostics. Its executable source does not access a browser or
page global. It has no runtime dependency.

The Kernel deliberately does not query DOM, construct observers, inject CSS,
write storage, copy text, render settings, perform network requests, resolve
feature dependencies, or install code. Those operations are supplied through a
context factory by each host.

All official feature JavaScript is statically imported by `features/catalog.ts`
and bundled into both products. There is no registry, CDN loader, `eval`,
`Function` constructor, or remotely hosted code. This makes the reviewed source
the code that runs, avoids a second update channel, and is required by MV3's
remote-code policy.

## Dependency graph

```text
apps/userscript  -> @exlg/host-userscript
apps/extension   -> @exlg/host-webext

@exlg/host-userscript --+--> @exlg/runtime/internal
                        +--> @exlg/browser
                        +--> @exlg/luogu
                        +--> @exlg/control-center
                        `--> @exlg/features

@exlg/host-webext ------+--> @exlg/runtime/internal
                        +--> @exlg/browser
                        +--> @exlg/luogu
                        +--> @exlg/control-center
                        `--> @exlg/features

@exlg/features ---------+-> @exlg/runtime (public API only)
                       `-> @exlg/luogu (feature-facing types only)
@exlg/browser -----------> @exlg/runtime
@exlg/luogu ------------+-> @exlg/runtime
                        `-> @exlg/browser
@exlg/control-center ----> @exlg/runtime + Preact
```

The boundary checker reads workspace manifests and rejects package cycles. It
also rejects legacy runtime imports and restricted globals in Feature source.

## Scope hierarchy and disposal

```text
Host application Scope
  -> Kernel Scope
       -> Feature Scope
            -> activate resources
            -> current Page Mount Scope
```

A Scope aborts its `AbortSignal` first and then executes registered cleanups in
LIFO order. Child disposal is a registered parent cleanup. Cleanup is idempotent,
async cleanup is awaited, and one cleanup failure is reported without stopping
the rest. Adding cleanup to an already disposed Scope starts that cleanup
immediately. That late-cleanup rule is what makes an async hook safe when it
returns after its page or feature has already gone away.

Disabling a Feature disposes its whole Feature Scope, which first removes the
current page resources and then activation resources. A route change only
disposes the Page Mount Scope; activation resources remain alive.

## Lifecycle and concurrency

On enable, Kernel creates a Feature Scope and runs `activate` once. After a
successful activation it compares the latest RouteSnapshot with `matches`. A
match creates a child Page Mount Scope and starts `mount`; a non-match leaves the
Feature `idle`.

For a changed route key, Kernel queues reconciliation for each Feature, aborts
and disposes the old Page Mount Scope, then starts the new matching mount. It does
not wait for an old hook's unresolved promise before accepting a newer route.
Feature and mount generation tokens ensure a stale completion cannot update the
new status. If that stale completion returns a Cleanup, it is added to its
already disposed Scope and therefore runs immediately.

An activation or mount error affects only that Feature, records a short local
diagnostic, and sets its status to `error`. Retry disposes the failed Feature
Scope and performs a clean activation/mount attempt. Stop disposes the Kernel
Scope and every Feature below it.

## Route flow

`@exlg/luogu` parses a URL into a host-neutral RouteSnapshot. The key includes
pathname, search, and hash; recognized route parameters are also represented in
the pathname and exposed in `params`.

The route source reads the initial URL and listens for `popstate`, `hashchange`,
and the namespaced `exlg:vnext:history-change` event. The small MAIN-world bridge
wraps `history.pushState` and `history.replaceState`, emits that event, and
answers one narrowly typed current-user request. The identity response contains
only a validated numeric `uid` and optional string `name`; it never exposes a
page object or generic page-world RPC.

## Host boundaries

The UserScript host is the only package that references `GM_*` APIs. Its bridge
is the only UserScript source that references `unsafeWindow`. It adapts GM
storage, GM clipboard, the history bridge, and bootstrap.

The extension runs Kernel, Control Center, and Features in an isolated content-script world.
Its platform adapter uses `browser.storage.local` when present and Chromium's
native `chrome.storage.local` fallback. A separate MV3 content script runs the
minimal history/session wrapper in the MAIN world. A small MV3 service worker is
now present solely as the broker for the closed cross-origin Network targets;
it is not a scheduler, general RPC endpoint, or Feature host.

Both hosts instantiate the same Kernel implementation, browser services, Luogu
route source, Shadow DOM Control Center, static feature catalog, and feature
source. Capabilities are metadata only; the MVP does not claim to provide a
security sandbox.

Feature Context uses a small generic extension type. Kernel passes the host's
typed context through but does not import, inspect, or branch on Luogu services.
Both hosts compose the same `LuoguFeatureServices`; existing Features accept the
base context unchanged.

## Wave 1 public services

Wave 1 adds capabilities to the browser/Luogu adapters without changing the
Kernel state machine or Scope semantics:

- `NetworkService` accepts only a closed `NetworkTarget` union. Features submit
  paths, never origins. Luogu requests remain same-origin with credentials;
  Codeforces, AtCoder Problems, and the two CPH loopback origins use fixed Host
  mappings with credentials omitted, bounded timeout/response size, redirect
  validation, and abort support.
- UserScript cross-origin requests use anonymous `GM_xmlhttpRequest` and exact
  `@connect` entries. Extension requests cross the closed MV3 broker message
  union; the broker independently validates target, path, method, headers,
  timeout, redirect origin, and response size.
- `NavigationService` resolves relative paths against the current Luogu origin,
  rejects active-content protocols, and applies an explicit allowlist before
  opening external pages.
- `FeatureUiService` provides only text toast/confirm/prompt primitives in a
  scope-bound Shadow Root. It is independent of Control Center and is removed
  when the owning Feature/Page Scope is disposed.
- `LuoguEditorService` exposes textarea-like value, selection, focus, submit,
  key-listener, and toolbar operations. It follows editor DOM rebuilds without
  returning CodeMirror, Vue, or page-owned editor objects.
- `LuoguPageDataService` exposes narrowly sanitized Problem, Contest, Training,
  Record, current-user practice PID, and route-user fields. Array/text limits
  are applied before data crosses into a Feature; arbitrary page state, token,
  Cookie, and functions never do.

Settings now include native finite `number` definitions with bounds/step/integer
validation and stable-order `multiSelect` arrays. The same normalization is used
by Feature contexts, Control Center, storage reads, and configuration import.
Capabilities remain auditable metadata rather than a claimed runtime sandbox.

```text
Feature -> public runtime context
        -> public, sanitized Luogu adapters (when declared)

Host -> fixed network transport / extension broker
     -> DOM, navigation, UI, editor and page-data implementations

Kernel -> lifecycle only; no dependency on any service implementation
```

## Control Center system application

The Control Center is a Host-mounted system application, not a Feature and not
part of Kernel. It remains available when every Feature is disabled, when a
Feature has failed, and on routes that match no Feature. It therefore has no
Feature ID, does not enter the catalog, and cannot be disabled through the
Feature lifecycle.

```text
Host application Scope
  +-- Kernel
  +-- Control Center
  `-- Browser and Luogu services
```

Hosts pass the Control Center a narrow controller surface: immutable catalog
metadata, `KernelController`, the same `RouteSource` instance used by Kernel, a
schema-validating Feature configuration controller, a preferences store bound
to `exlg:vnext:control-center`, clipboard access, and non-sensitive host/version
metadata. It never receives Feature data storage, a FeatureContext, private
message transport, a page-world bridge, or Kernel records.

Preact is an implementation detail of `@exlg/control-center`. It renders into a
Shadow Root and is absent from `@exlg/runtime`, Feature APIs, and page globals.
Features contribute only `FeatureMetadata` and `SettingsSchema`; they cannot
inject JSX, custom views, commands, or callbacks into the system UI.

The Control Center lists the static official catalog shipped in the current
build. There is no Market because ExLG Next does not download or execute remote
Feature code. Configuration import changes only enabled state and validated
schema settings; it is not a code or business-data import path.

## Why there are no Feature dependencies

The built-in features use only declared host-provided context services and
narrow public Luogu adapters. A Feature dependency graph, semver
solver, install protocol, and failure
propagation model would add package-management responsibilities without testing
the lifecycle primitives. Feature dependencies remain a future design question,
not dormant MVP infrastructure.
