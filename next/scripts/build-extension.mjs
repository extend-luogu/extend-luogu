import { copyFile, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const nextRoot = fileURLToPath(new URL('..', import.meta.url))
const outputDirectory = fileURLToPath(new URL('../dist/extension', import.meta.url))
const watching = process.argv.includes('--watch')
const aliases = [
  ['@exlg/runtime/internal', '../packages/runtime/src/internal.ts'],
  ['@exlg/runtime', '../packages/runtime/src/index.ts'],
  ['@exlg/browser', '../packages/browser/src/index.ts'],
  ['@exlg/luogu', '../packages/luogu/src/index.ts'],
  ['@exlg/control-center', '../packages/control-center/src/index.ts'],
  ['@exlg/host-userscript', '../packages/host-userscript/src/index.ts'],
  ['@exlg/host-webext/bridge', '../packages/host-webext/src/bridge.ts'],
  ['@exlg/host-webext', '../packages/host-webext/src/index.ts'],
  ['@exlg/features', '../features/catalog.ts'],
].map(([find, path]) => ({ find, replacement: fileURLToPath(new URL(path, import.meta.url)) }))

await rm(outputDirectory, { recursive: true, force: true })
await mkdir(outputDirectory, { recursive: true })
await copyFile(
  fileURLToPath(new URL('../apps/extension/manifest.json', import.meta.url)),
  fileURLToPath(new URL('../dist/extension/manifest.json', import.meta.url)),
)

const buildEntry = (entry, name, fileName) => build({
  configFile: false,
  root: nextRoot,
  resolve: { alias: aliases },
  build: {
    target: 'es2022',
    outDir: outputDirectory,
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    watch: watching ? {} : null,
    lib: {
      entry,
      name,
      formats: ['iife'],
      fileName: () => fileName,
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})

await buildEntry('apps/extension/src/content.ts', 'ExLGNextContent', 'content.js')
await buildEntry('apps/extension/src/history-bridge.ts', 'ExLGNextHistoryBridge', 'history-bridge.js')
await buildEntry('packages/host-webext/src/network-broker.ts', 'ExLGNextNetworkBroker', 'network-broker.js')
