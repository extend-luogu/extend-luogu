import { defineConfig } from 'vite'
import { aliases } from './vite.aliases'
import workspaceManifest from './package.json'

const metadata = `// ==UserScript==
// @name         ExLG Next MVP
// @namespace    https://github.com/extend-luogu/extend-luogu
// @version      ${workspaceManifest.version}
// @description  ExLG Next host-independent features and control center
// @match        https://www.luogu.com.cn/*
// @match        https://*.luogu.com.cn/*
// @match        https://www.luogu.com/*
// @match        https://*.luogu.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      codeforces.com
// @connect      kenkoooo.com
// @connect      localhost
// @connect      127.0.0.1
// ==/UserScript==`

export default defineConfig({
  resolve: { alias: aliases },
  plugins: [{
    name: 'exlg-userscript-metadata',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk' && output.isEntry) {
          output.code = `${metadata}\n${output.code}`
        }
      }
    },
  }],
  build: {
    target: 'es2022',
    outDir: 'dist/userscript',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    lib: {
      entry: 'apps/userscript/src/main.ts',
      name: 'ExLGNext',
      formats: ['iife'],
      fileName: () => 'exlg-next.user.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
