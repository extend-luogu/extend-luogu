import { fileURLToPath, URL } from 'node:url'
import type { Alias } from 'vite'

const aliasEntries = [
  ['@exlg/runtime/internal', './packages/runtime/src/internal.ts'],
  ['@exlg/runtime', './packages/runtime/src/index.ts'],
  ['@exlg/browser', './packages/browser/src/index.ts'],
  ['@exlg/luogu', './packages/luogu/src/index.ts'],
  ['@exlg/control-center', './packages/control-center/src/index.ts'],
  ['@exlg/host-userscript', './packages/host-userscript/src/index.ts'],
  ['@exlg/host-webext/bridge', './packages/host-webext/src/bridge.ts'],
  ['@exlg/host-webext', './packages/host-webext/src/index.ts'],
  ['@exlg/features', './features/catalog.ts'],
 ] as const

export const aliases: Alias[] = aliasEntries.map(([find, path]) => ({
  find,
  replacement: fileURLToPath(new URL(path, import.meta.url)),
}))
