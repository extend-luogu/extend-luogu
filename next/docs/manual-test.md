# ExLG Next MVP manual test

## Build prerequisites

Use Node.js 20 or newer and pnpm. From the repository root:

```sh
pnpm install
pnpm mvp:check
```

The command must finish after typecheck, the unit tests, both production builds,
boundary lint, and artifact validation.

## Install the UserScript

1. Build with `pnpm mvp:build:userscript`.
2. Open `next/dist/userscript/exlg-next.user.js` in Tampermonkey or import it
   through Tampermonkey's Utilities page.
3. Confirm the requested grants are only GM value storage, GM clipboard, and
   `unsafeWindow`; there is no `@connect` declaration.
4. Open `https://www.luogu.com.cn/problem/P1000` and confirm the round `Ex`
   launcher appears near the upper-right corner.

## Install the Chromium MV3 extension

1. Build with `pnpm mvp:build:extension`.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load
   unpacked**.
3. Select `next/dist/extension`.
4. Confirm Chrome reports only storage and clipboard-write capabilities, then
   open a Luogu page and confirm the same `Ex` launcher and panel appear.

Test the hosts separately for unambiguous observations. The MVP intentionally
does not implement a dual-install exclusion protocol.

## Lifecycle acceptance

Run the following once in each host:

1. Open the panel and verify the four titles, descriptions, capabilities,
   switches, statuses, and generated setting controls.
2. On a page containing `pre > code`, enable **代码块复制**. Existing code blocks
   receive one button. Run this in DevTools to insert another block and verify it
   receives exactly one button:

   ```js
   const pre = document.createElement('pre')
   const code = document.createElement('code')
   code.textContent = 'dynamic code'
   pre.append(code)
   document.body.append(pre)
   ```

3. Copy both blocks. Change button text, language display, and position; each
   change should remount immediately without a refresh.
4. Disable the Feature. Its buttons and injected style elements disappear
   immediately. Re-enable it and confirm one button per code block.
5. On `/problem/P1000`, enter a local note and blur the textarea. Navigate to a
   different problem through a normal Luogu link: the old component is removed
   and the other problem starts with its own text. Return to P1000 and refresh;
   the original note remains.
6. Enable **路由诊断标记**. Navigate with normal links, browser back/forward,
   query changes, and hash changes. The displayed kind/key changes; inspecting
   the page should show one indicator, not accumulated old nodes.
7. Disable either visible Feature and verify its page UI disappears without a
   refresh. Activation resources remain only across route changes, not disable.
8. To inspect error isolation, temporarily make one local feature hook throw,
   rebuild, and verify its card shows `发生错误` plus Retry while the other
   Features continue working. Remove the temporary throw afterward.

The async route/disable races are deterministic unit tests in
`packages/runtime/test/kernel.test.ts`; no real Luogu or network access is used
by the test suite.

## Real private-message acceptance

Repeat this workflow separately for the UserScript and Chromium extension. It
requires two real Luogu accounts; never paste cookies, tokens, or private-message
content into a bug report.

1. Build the selected host and log account A into Luogu.
2. Open two account-A tabs on pages other than `/chat` and enable **站内私信提醒**.
3. From account B, send account A one private message.
4. Confirm each non-chat tab shows exactly one card for that message, including
   the sender avatar, username, preview, close button, **私信** label, and **查看**
   link.
5. Open `/chat` and confirm that page does not render an additional reminder
   card.
6. Close the tab currently holding the WebSocket lock. Send another message and
   confirm the remaining tab takes leadership and receives it once.
7. Change preview, maximum-visible, and dismiss-time settings. Confirm renderer
   behavior changes without a second WebSocket connection.
8. Disable the Feature and confirm its cards disappear and no socket, channel,
   lock wait, or reconnect timer remains.
9. Simulate offline/online recovery and confirm reconnect follows bounded
   backoff without putting the Feature permanently into error.
10. Repeat steps 1–9 with the other host.

Build and fake-dependency tests do not count as this logged-in end-to-end check.
