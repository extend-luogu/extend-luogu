# extend-luogu

[![Node.js Package](https://github.com/extend-luogu/extend-luogu/actions/workflows/npm-publish.yml/badge.svg?branch=main)](https://github.com/extend-luogu/extend-luogu/actions/workflows/npm-publish.yml)

## Installation

1. Install a userscript manager e.g. [TamperMonkey](https://www.tampermonkey.net/).
2. Visit [https://celeste.dl.exlg.cc/latest/dist/extend-luogu.min.user.js](https://celeste.dl.exlg.cc/latest/dist/extend-luogu.min.user.js) to get the latest version of exlg.

## Official Modules

| Package | Version | Package | Version |
|---------|---------|---------|---------|
| exlg-mod-badge | [![](https://img.shields.io/npm/v/exlg-mod-badge?style=flat-square)](https://www.npmjs.com/package/exlg-mod-badge) | @exlg/mod-benben | [![](https://img.shields.io/npm/v/@exlg/mod-benben?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-benben) |
| @exlg/mod-captcha | [![](https://img.shields.io/npm/v/@exlg/mod-captcha?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-captcha) | @exlg/mod-code-block-ex | [![](https://img.shields.io/npm/v/@exlg/mod-code-block-ex?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-code-block-ex) |
| @exlg/mod-dbc-jump-problem | [![](https://img.shields.io/npm/v/@exlg/mod-dbc-jump-problem?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-dbc-jump-problem) | @exlg/mod-discussion-save | [![](https://img.shields.io/npm/v/@exlg/mod-discussion-save?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-discussion-save) |
| exlg-mod-dropdown | [![](https://img.shields.io/npm/v/exlg-mod-dropdown?style=flat-square)](https://www.npmjs.com/package/exlg-mod-dropdown) | @exlg/mod-emoticon | [![](https://img.shields.io/npm/v/@exlg/mod-emoticon?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-emoticon) |
| @exlg/mod-juan-inspector | [![](https://img.shields.io/npm/v/@exlg/mod-juan-inspector?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-juan-inspector) | @exlg/mod-messages | [![](https://img.shields.io/npm/v/@exlg/mod-messages?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-messages) |
| @exlg/mod-meta-discussion-guide | [![](https://img.shields.io/npm/v/@exlg/mod-meta-discussion-guide?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-meta-discussion-guide) | @exlg/mod-original-difficulty | [![](https://img.shields.io/npm/v/@exlg/mod-original-difficulty?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-original-difficulty) |
| @exlg/mod-rand-problem-ex | [![](https://img.shields.io/npm/v/@exlg/mod-rand-problem-ex?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-rand-problem-ex) | @exlg/mod-token | [![](https://img.shields.io/npm/v/@exlg/mod-token?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-token) |
| @exlg/mod-user-problem-ex | [![](https://img.shields.io/npm/v/@exlg/mod-user-problem-ex?style=flat-square)](https://www.npmjs.com/package/@exlg/mod-mod-user-problem-ex) |

More modules coming soon...

## ExLG Next MVP

The host-independent lifecycle MVP lives in [`next/`](next/README.md). It builds
the same feature catalog for a single-file UserScript and a Chromium Manifest V3
extension without changing the existing Celeste build.

```sh
pnpm install
pnpm mvp:check
```

The installable outputs are `next/dist/userscript/exlg-next.user.js` and
`next/dist/extension/`. See [`next/docs/manual-test.md`](next/docs/manual-test.md)
for installation and acceptance steps.

Both products include the same Shadow DOM + Preact Control Center system app for
Feature management, schema settings, local diagnostics, and settings-only
configuration import/export. Its boundary and privacy rules are documented in
[`next/docs/control-center.md`](next/docs/control-center.md).
