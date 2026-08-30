# Private-message transport

## Lifecycle placement

`official.private-message-notifier` subscribes in `activate`, so one Feature
Scope owns the session request, cross-tab coordination, WebSocket, reconnect
timer, and normalized message subscription across SPA route changes. Its
`mount` owns only the current route's Shadow DOM renderer and dismissal timers.
Changing settings remounts the renderer without reconnecting. A `/chat` mount
intentionally creates no renderer.

Transport remains in `@exlg/browser` and `@exlg/luogu`; Kernel receives a typed
Context extension but knows nothing about WebSocket, current users, messages,
locks, or BroadcastChannel.

## Current-user bridge

The document-start MAIN-world bridge reads either
`_feInstance.currentUser` or `_feInjection.currentUser`. It returns only:

```ts
{ uid: number, name?: string }
```

UID must be a positive safe integer. Extra fields, nested data, functions,
cookies, tokens, and CSRF values are discarded before the response event is
created. The isolated-world service retries for a finite period because page
state may initialize after document-start, respects AbortSignal, and treats a
known logged-out state as `null`.

## Connection and protocol

The adapter requests `/_lfe/config` from the current page origin with included
credentials and accepts `response.ws.server` only when it is a `wss:` URL on a
Luogu-owned hostname. Failure uses the fixed `wss://ws.luogu.com.cn/ws`
fallback and logs only a generic warning.

On open it sends only the documented `join_channel` packet for channel `chat`
and the validated current UID. Incoming data must be JSON with
`_ws_type === "server_broadcast"`; message ID, body, sender, and optional receiver
are validated and copied into a new normalized object. Frames and private bodies
are never logged, persisted, placed in diagnostics, or sent through the
MAIN-world bridge.

Unexpected closure reconnects after approximately 1, 2, 4, 8, and then 15
seconds with small jitter. Scope abort closes the current socket, cancels the
timer, invalidates old socket generations, and prevents future reconnects. No
undocumented heartbeat or business packet is sent.

## Cross-tab coordination

Each tab opens the same BroadcastChannel and attempts the exclusive Web Lock
`exlg:vnext:private-message-socket`. The lock holder owns the socket. It delivers
each normalized message locally and broadcasts it once; followers validate the
broadcast again and deliver it locally. The sender never relies on receiving its
own BroadcastChannel post.

When the leader's Scope ends, its task resolves and releases the lock so a
waiting tab takes over. Abort cancels lock waiting and closes the channel. If Web
Locks is absent, every tab may own a socket; no replacement election protocol is
invented. Each service keeps only the latest 256 message IDs in memory, so
fallback duplicates do not create repeated cards in that tab.

## Known protocol dependencies

The implementation depends on Luogu continuing to expose one of the two current
user page fields, return a compatible `/_lfe/config` response, accept the chat
join packet, and send the validated `server_broadcast` shape. These are adapter
dependencies rather than Kernel contracts and require logged-in browser
qualification after upstream changes.
