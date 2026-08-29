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
                        +--> @exlg/ui
                        `--> @exlg/features

@exlg/host-webext ------+--> @exlg/runtime/internal
                        +--> @exlg/browser
                        +--> @exlg/luogu
                        +--> @exlg/ui
                        `--> @exlg/features

@exlg/features ---------> @exlg/runtime (public API only)
@exlg/browser -----------> @exlg/runtime
@exlg/luogu -------------> @exlg/runtime
@exlg/ui ----------------> @exlg/runtime
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
wraps only `history.pushState` and `history.replaceState` and emits that event.
It exposes no page objects and implements no page-world RPC.

## Host boundaries

The UserScript host is the only package that references `GM_*` APIs. Its bridge
is the only UserScript source that references `unsafeWindow`. It adapts GM
storage, GM clipboard, the history bridge, and bootstrap.

The extension runs Kernel, UI, and Features in an isolated content-script world.
Its platform adapter uses `browser.storage.local` when present and Chromium's
native `chrome.storage.local` fallback. A separate MV3 content script runs the
minimal history wrapper in the MAIN world. No background or service worker is
created because the MVP does not need one.

Both hosts instantiate the same Kernel implementation, browser services, Luogu
route source, Shadow DOM settings panel, static feature catalog, and feature
source. Capabilities are metadata only; the MVP does not claim to provide a
security sandbox.

## Why there are no Feature dependencies

The three MVP features need only host-provided `dom`, `storage`, and `clipboard`
capabilities. A dependency graph, semver solver, install protocol, and failure
propagation model would add package-management responsibilities without testing
the lifecycle primitives. Feature dependencies remain a future design question,
not dormant MVP infrastructure.
