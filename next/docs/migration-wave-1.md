# ExLG Next Legacy Migration Wave 1

Wave 1 preserves the user value of the listed legacy modules while replacing
their jQuery/global/runtime coupling with scoped Next Features. Status describes
the shippable implementation, not whether a logged-in browser qualification has
been performed. The latter is recorded independently and must not be inferred
from unit tests or builds.

## Baseline and final gates

- Baseline: `next` at `e9028ff`; `pnpm mvp:check` passed with 100 tests.
- Baseline artifacts: UserScript 181.13 kB (41.59 kB gzip), extension content
  178.42 kB (40.98 kB gzip).
- Final `pnpm install --frozen-lockfile`, `mvp:typecheck`, `mvp:test`,
  `mvp:lint`, both builds, artifact verification, and `mvp:check` passed.
- Final tests: 175 passed across 29 files; no real network was used.
- Final UserScript: 291,663 bytes (Vite: 286.24 kB, 68.88 kB gzip).
- Final extension: content 289,523 bytes (Vite: 284.10 kB, 68.39 kB gzip),
  broker 6,056 bytes, MAIN-world bridge 3,008 bytes, manifest 975 bytes;
  299,562 bytes total for the loadable directory files.

## Migration status

| Feature | Legacy source | Status | Automated tests | Build | Manual verification | Notes / Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| `official.code-block-copy` | `legacy/code-block-ex`, `main/code-block-ex` | COMPLETE | Initial/dynamic code, copy, timer and full cleanup | Passed (`mvp:check`) | Current code-block DOM inspected; current worktree build not installed | Existing ID/default/settings retained; title, language, style and feedback added |
| `official.user-introduction` | `main/show-user-desc` | COMPLETE | Folded fixture, restore and missing DOM | Passed (`mvp:check`) | User route inspected, but no non-empty folded public introduction sample was exercised | Safe no-op outside semantic introduction containers; no edit-mode mutation |
| `official.solution-spoiler-guard` | `legacy/misc` | COMPLETE | Confirm navigation, route and cleanup fixtures | Passed (`mvp:check`) | Current solution link shape inspected; current worktree build not installed | Hide/dim/confirm and optional difficulty/rate blur are page-local |
| `official.back-to-contest` | `legacy/misc` | COMPLETE | Valid/missing contest ID and cleanup | Passed (`mvp:check`) | Current problem action area inspected | Uses query or sanitized Contest adapter only |
| `official.record-difficulty-colors` | `legacy/misc` | COMPLETE | PID mapping, current nine levels, label/title and restore | Passed (`mvp:check`) | Current record links inspected; live sanitized list response not exercised in installed build | Current 0–8 difficulty names/colors; DOM order is not used |
| `official.home-discussion-density` | `legacy/misc` | COMPLETE | Limit, dynamic insert, expand and restore | Passed (`mvp:check`) | Current homepage discussion container inspected | Hides rather than deletes; non-discussion articles ignored |
| `official.auto-o2` | `legacy/auto-o2` | COMPLETE | Current semantic label fixture, modes and cleanup | Passed (`mvp:check`) | Current O2/language/submit controls inspected read-only | Uses normal click/change flow; never removes site listeners or submits itself |
| `official.editor-emoticons` | `legacy/emoticon`, `main/emoticon` | COMPLETE | Adapter toolbar, local insertion, cleanup and alias helpers | Passed (`mvp:check`) | No real editor write performed | Ships a license-safe local text-emoticon subset; no remote image host |
| `official.editor-shortcuts` | `legacy/blog`, `legacy/benben` | REMOVED | Previous shortcut coverage retired with the Feature | Not shipped | Current Luogu editor shortcuts supersede this Feature | Removed to avoid intercepting or duplicating native editor shortcuts |
| `official.editor-formatting` | `legacy/blog` | COMPLETE | Token-aware prose, code, URL, link, tag, LaTeX and math tests | Passed (`mvp:check`) | No real editor write performed | Local only; legacy cloud formatter intentionally excluded |
| `official.quick-navigation` | `legacy/keyboard-cli`, `legacy/board`, `main/dbc-jump-problem` | COMPLETE | 10 parser cases, palette keyboard/navigation and cleanup | Passed (`mvp:check`) | Current destination routes inspected; no live username search | Fixed actions and typed IDs only; no legacy CLI/module commands or arbitrary URL |
| `official.random-problem` | `legacy/rand-problem-ex`, current typed API reference | COMPLETE | Legacy/current response validation, filter serialization, accepted exclusion, empty/error helpers and navigation | Passed (`mvp:check`) | Public homepage DOM, live content requests, and final navigation exercised with the current UserScript bundle in headless Chrome; logged-in exclusion not exercised | Mounts beside the native jump controls; prefers the current Lentille header; difficulty `0` is treated as unbounded because the current endpoint cannot isolate unrated problems |
| `official.training-randomizer` | `legacy/rand-training-problem` | COMPLETE | Four candidate modes, current accepted/submitted form, navigation and empty handling | Passed (`mvp:check`) | Current training action/list structure inspected read-only | Missing private status degrades to `unknown`; no old `tInfo` exposure |
| `official.tasklist-enhancer` | `legacy/tasklist-ex` | COMPLETE | Current task fixture, hide/toggle/random, dynamic update and restore | Passed (`mvp:check`) | Current homepage task container inspected | Never changes server task state and does not search `innerHTML` for icons |
| `official.original-difficulty` | `legacy/original-difficulty`, `main/original-difficulty` | COMPLETE | CF PID/result, AtCoder transform/map/cache inputs and rendered value | Passed (`mvp:check`) | No real external provider request | Bounded versioned 24-hour default cache; network absence is local “不可用” |
| `official.import-to-cph` | `legacy/import-problem-to-cph`, current Competitive Companion shape | COMPLETE | Template/payload, explicit click, broker origin/method/credentials and partial batch logic | Passed (`mvp:check`) | Real localhost receiver not run | Never sends a probe payload; only explicit imports POST validated problem data |
| `official.user-notes` | `legacy/user-comment` | COMPLETE | Sanitization, UID storage, dynamic link display, immediate refresh and original-name restore | Passed (`mvp:check`) | No real note was written | Private Feature data only; omitted from configuration export and diagnostics |

## Status summary

- COMPLETE: 17
- PARTIAL_SHIPPABLE: 0
- BLOCKED: 0

There are therefore no blocked classifications or half-built Catalog entries in
this wave. “Manual verification not run” is a qualification gap, not silently
relabelled as an implementation blocker. If a future current-site change makes a
Feature non-functional, use one of the required blocker categories, remove its
Catalog entry, and record the smallest evidence-based unlock condition.

## Shared capability evidence

- Runtime settings tests cover finite number validation, bounds, step/integer,
  `NaN`/Infinity, multi-select type inference, de-duplication, unknown values,
  and stable option order.
- Configuration/storage tests cover shared default merging and number/array
  import/export without Feature data access.
- Network tests cover fixed origins, path/method/header validation, abort,
  timeout, HTTP/JSON/redirect/size errors, anonymous UserScript transport, and
  the closed extension broker including CPH credential omission.
- Editor tests cover wait, selection edits, input/change, focus, toolbar rebuild,
  no-editor timeout/abort, and cleanup.
- Page-data tests cover current/legacy response wrappers, renamed title fields,
  nine difficulty levels, Contest/Training/Record sanitization, private field
  removal, current-user practice PID isolation, missing login, and array bounds.
- Boundary checks resolve relative imports before accepting them, reject Feature
  directory escapes and complete external URLs, map every network target to a
  declared capability, verify context capability metadata, reject package
  cycles, and audit exact UserScript/extension host permissions.

## Manual qualification boundary

Read-only current-site inspection was used to confirm semantic homepage,
problem action, O2, record-link, training-action, task-list, and solution-link
shapes. It did not install the current worktree artifacts and did not perform
editor writes, CPH localhost transmission, external provider calls, note writes,
or logged-in cross-tab private-message delivery. Follow
[`manual-test.md`](./manual-test.md) for those separate gates.
