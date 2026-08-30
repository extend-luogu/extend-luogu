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
3. Confirm the grants are GM value storage, GM clipboard,
   `GM_xmlhttpRequest`, and bridge-only `unsafeWindow`. Confirm `@connect` is
   limited to `codeforces.com`, `kenkoooo.com`, `localhost`, and
   `127.0.0.1`; there must be no `@connect *`.
4. Open `https://www.luogu.com.cn/problem/P1000` and confirm the narrow `ExLG`
   launcher appears on the right page edge.

## Install the Chromium MV3 extension

1. Build with `pnpm mvp:build:extension`.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load
   unpacked**.
3. Select `next/dist/extension`.
4. Confirm Chrome reports storage and clipboard-write permissions plus only the
   four precise external host permissions above. Confirm the only background
   worker is `network-broker.js`, then
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

## Control Center acceptance

Repeat the following in both the UserScript and unpacked extension builds:

1. Open and close the drawer with the Launcher, backdrop, Escape, and
   `Alt+Shift+E`. Confirm focus enters the dialog and returns to the Launcher.
2. In **面板设置**, switch Launcher between left and right, try light/dark/system
   themes, and compare comfortable/compact density. Reload and confirm choices
   persist. The Launcher must never become completely unavailable.
3. At a narrow viewport, confirm the drawer becomes full-width, navigation and
   forms do not overflow, IDs/errors wrap, and the close button remains visible.
4. In **功能**, search by title, ID, capability, and setting title. Exercise all
   category and state filters, then clear search to restore the catalog.
5. Toggle each Feature without refreshing. Open details, change boolean/select
   settings, then edit a string and commit with blur and Enter. An enabled
   Feature remounts; editing a disabled Feature must not start it.
6. Put a temporary local test Feature into `error`, verify the row/detail retry
   actions, and remove the temporary change afterward. Other Features and the
   Control Center must remain usable.
7. Use **恢复本功能默认设置** for **本地题目笔记** and accept the confirmation.
   Confirm its settings reset but saved per-problem note text remains.
8. In **数据**, export by clipboard and file. Inspect JSON: it may contain only
   catalog Feature IDs, enabled booleans, and schema-backed setting values. It
   must not contain note text, private-message content, or Feature data keys.
9. Edit a valid exported setting and enabled state, paste/import it, inspect the
   preview counts, cancel once, then confirm. Verify merge semantics leave an
   omitted Feature unchanged.
10. Try an unknown Feature, unknown setting, wrong boolean type, invalid select,
    wrong format/version, and a file over 1 MiB. They must be rejected or counted
    as ignored without arbitrary storage writes.
11. In **诊断**, verify route kind/path and Feature state/routeKey/error. Copy the
    report and confirm it has no query, hash, UID, username, settings values,
    note/private-message content, Cookie, CSRF, token, or stack dump.
12. Press Ctrl/Cmd+K while open and confirm focus moves to Feature search. Use
    Tab/Shift+Tab to confirm focus remains inside the modal drawer.
13. Enable and configure **站内私信提醒** from its detail page; verify the
    existing WebSocket/cross-tab behavior below is unchanged.
14. Test `pagehide` by navigating away and inspect that the Shadow host,
    subscriptions, and keyboard handler do not remain in the old document.

The jsdom suite verifies state, import planning, settings isolation, Launcher,
keyboard, focus, backdrop, reset confirmation, and idempotent cleanup. Visual
appearance, responsive behavior, and integration with real Luogu CSS still
require the browser checks above.

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

## Legacy Migration Wave 1 manual acceptance

Run both hosts separately. Each migrated Feature starts disabled, except the
existing `official.code-block-copy` default. After each check, disable the
Feature and confirm its nodes, styles, listeners, observers, timers, and requests
are removed or aborted.

1. **代码块增强**: on a problem, solution, and record detail page, check title,
   detected language, both button positions/styles, success/failure feedback,
   dynamic code blocks, and that editor/live-preview blocks are skipped.
2. **用户介绍默认显示**: find a user with a non-empty folded introduction,
   open the user main view, and confirm it expands but edit mode is untouched.
3. **题解防剧透**: on a problem page test hide/dim/confirm, cancel and confirm,
   in-page reveal behavior, optional difficulty/rate blur, and cleanup.
4. **返回比赛**: enter a problem from a contest and confirm the action links to
   `/contest/<id>#problems`; a normal problem must have no action.
5. **记录难度着色**: open `/record/list`, paginate or trigger a partial refresh,
   and verify PID mapping, text/label settings, title semantics, and restoration.
6. **主页讨论数量**: on `/`, set 4/12/30, expand/collapse, wait for a dynamic
   refresh, and verify items are hidden rather than deleted.
7. **自动 O2**: with an O2-capable and unsupported language, exercise all three
   modes, manually turn O2 off, rebuild the submit area, and confirm no duplicate
   submission occurs.
8. **编辑器表情**: in discussion and blog editors, toggle groups/panel defaults,
   insert at a selection, test one `/name/` alias, rebuild the editor, and disable.
9. **编辑器快捷键**: test B/I/Shift+X with and without selection, IME input, a
   non-editor input, and optional Ctrl/Cmd+Enter through the normal site flow.
10. **本地排版**: test Chinese/Latin/number/math spacing and confirm fenced
    code, inline code, URLs, link targets, tags, LaTeX commands, and newlines stay
    byte-for-byte unchanged where protected.
11. **快捷导航**: test Alt+K, keyboard selection/focus loop, every fixed page,
    typed UID/contest/record/discussion IDs, username search, supported problem
    IDs, bounded history, and disabled-by-default double-click navigation.
12. **增强随机题目**: choose several difficulty/source combinations, verify no
    duplicate request while pending, empty/error feedback, and—while logged
    in—that known accepted PIDs are excluded.
13. **题单随机跳题**: on a training with mixed states, exercise all four modes,
    logged-out/unknown status fallback, empty candidates, and dynamic actions.
14. **任务计划增强**: on `/`, verify accepted detection, show/hide, both random
    ranges, empty state, dynamic task updates, and that server state is unchanged.
15. **原始难度**: test one Codeforces and one AtCoder-backed problem, unavailable
    rating, cache reuse/expiry, provider selection, and offline recovery.
16. **导入到 CPH**: start the user's own Competitive Companion/CPH receiver on
    port 27121, test localhost and loopback, single and contest imports,
    concurrency 1–4, partial failure, templates, and final summary. Inspect the
    request and confirm it contains problem samples/limits only—no Cookie, CSRF,
    login, note, message, or setting data. Automated tests do not contact it.
17. **用户备注**: add/edit/clear an 80-character-limited note, test append,
    replace, title-only, dynamic user links, restoration on disable/route change,
    reload persistence, and confirm configuration export omits the note.

Also re-run the existing problem-note, route-indicator, private-message, and
Control Center workflows after enabling several Wave 1 Features together.
