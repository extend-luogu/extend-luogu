# ExLG Next MVP

ExLG Next is a lightweight, host-independent feature lifecycle runtime. The MVP
ships four built-in features in both a UserScript and a Chromium MV3 extension.
It does not load or execute remote JavaScript and does not depend on the Celeste
runtime.

## Commands

```sh
pnpm mvp:dev:userscript
pnpm mvp:build:userscript
pnpm mvp:dev:extension
pnpm mvp:build:extension
pnpm mvp:test
pnpm mvp:typecheck
pnpm mvp:lint
pnpm mvp:check
```

Run these commands from the repository root. Build output is written to
`next/dist/`.

- [Architecture](docs/architecture.md)
- [Feature authoring](docs/feature-authoring.md)
- [Manual testing](docs/manual-test.md)
- [Private-message transport](docs/private-messages.md)
