import { readFile, readdir, realpath } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function filesBelow(relative, extensions = ['.ts']) {
  const result = []
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = `${path}/${entry.name}`
      if (entry.isDirectory()) await walk(child)
      else if (extensions.some(extension => entry.name.endsWith(extension))) result.push(child)
    }
  }
  await walk(`${root}/${relative}`)
  return result
}

function fail(file, message) {
  failures.push(`${file.slice(root.length + 1)}: ${message}`)
}

async function resolveLocalImport(file, specifier) {
  const base = resolve(dirname(file), specifier.split('?')[0])
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    try { return await realpath(candidate) }
    catch { /* try the next supported TypeScript resolution */ }
  }
  return null
}

for (const file of await filesBelow('features')) {
  if (file.endsWith('catalog.ts')) continue
  const source = await readFile(file, 'utf8')
  const forbidden = /\b(?:window|document|unsafeWindow|chrome|browser|WebSocket|BroadcastChannel|fetch|jQuery|_feInjection|_feInstance|eval|GM_[A-Za-z0-9_]+)\b|new\s+Function\b/g
  for (const match of source.matchAll(forbidden)) fail(file, `forbidden feature global: ${match[0]}`)
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const imported = match[1]
    if (imported?.startsWith('.')) {
      const target = await resolveLocalImport(file, imported)
      const featureDirectory = resolve(root, 'features', relative(resolve(root, 'features'), file).split('/')[0])
      if (!target || isAbsolute(relative(featureDirectory, target)) || relative(featureDirectory, target).startsWith('..')) {
        fail(file, `relative import escapes its Feature directory: ${imported}`)
      }
    }
    else if (imported !== '@exlg/runtime'
      && imported !== '@exlg/luogu'
      && !(file.includes('.test.') && imported === 'vitest')) {
      fail(file, `feature import must use public @exlg/runtime or @exlg/luogu: ${imported}`)
    }
  }
  if (!file.includes('.test.') && /https?:\/\//.test(source)) fail(file, 'feature contains a complete external URL')
}

const capabilityForTarget = {
  luogu: 'network.luogu',
  codeforces: 'network.codeforces',
  'atcoder-problems': 'network.atcoder',
  'cph-localhost': 'network.localhost',
  'cph-loopback': 'network.localhost',
}
const capabilityForContextMember = {
  dom: 'dom',
  storage: 'storage',
  clipboard: 'clipboard',
  navigation: 'navigation',
  ui: 'ui',
}
for (const featureName of await readdir(`${root}/features`)) {
  if (featureName === 'catalog.ts' || featureName === 'package.json') continue
  let sources
  try { sources = await filesBelow(`features/${featureName}`) }
  catch { continue }
  const runtimeSource = (await Promise.all(sources.filter(file => !file.includes('.test.')).map(file => readFile(file, 'utf8')))).join('\n')
  for (const [target, capability] of Object.entries(capabilityForTarget)) {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`\\.network\\.request(?:<[^>]+>)?\\(\\s*['"]${escaped}['"]`).test(runtimeSource)
      && !runtimeSource.includes(`'${capability}'`)) {
      failures.push(`features/${featureName}: uses ${target} without declaring ${capability}`)
    }
  }
  for (const [member, capability] of Object.entries(capabilityForContextMember)) {
    if (new RegExp(`\\bctx\\.${member}\\b`).test(runtimeSource)
      && !runtimeSource.includes(`'${capability}'`)) {
      failures.push(`features/${featureName}: uses ctx.${member} without declaring ${capability}`)
    }
  }
}

for (const file of await filesBelow('packages/runtime/src')) {
  const source = await readFile(file, 'utf8')
  const forbidden = /\b(?:window|document|unsafeWindow|chrome|browser|GM_[A-Za-z0-9_]+)\b/g
  for (const match of source.matchAll(forbidden)) fail(file, `forbidden runtime global: ${match[0]}`)
  if (/from\s+['"](?:preact|@exlg\/control-center|@exlg\/host-)/.test(source)) {
    fail(file, 'runtime imports UI or host code')
  }
}

for (const file of await filesBelow('packages/control-center/src', ['.ts', '.tsx'])) {
  const source = await readFile(file, 'utf8')
  const forbidden = /\b(?:unsafeWindow|chrome|browser|WebSocket|BroadcastChannel|GM_[A-Za-z0-9_]+)\b|\b(?:window\.exlg|window\.exlgDash)\b/g
  for (const match of source.matchAll(forbidden)) fail(file, `forbidden control center global: ${match[0]}`)
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const imported = match[1]
    if (imported === '@exlg/runtime/internal'
      || imported === '@exlg/features'
      || imported === '@exlg/core'
      || imported?.startsWith('@exlg/host-')
      || imported?.includes('/features/')) {
      fail(file, `forbidden control center import: ${imported}`)
    }
  }
}

for (const file of await filesBelow('.', ['.ts', '.tsx'])) {
  if (file.includes('/dist/')) continue
  const source = await readFile(file, 'utf8')
  if (/from\s+['"]@exlg\/core(?:\/|['"])/.test(source)) fail(file, 'imports legacy @exlg/core')
  if (/\b(?:window|unsafeWindow)\.exlg\b/.test(source)) fail(file, 'uses legacy global runtime')
  if (/\b(?:eval\s*\(|new\s+Function\b)/.test(source)) fail(file, 'uses dynamic code execution')
}

const packageDirectories = [
  'features',
  ...await readdir(`${root}/apps`).then(names => names.map(name => `apps/${name}`)),
  ...await readdir(`${root}/packages`).then(names => names.map(name => `packages/${name}`)),
]
const packages = new Map()
for (const directory of packageDirectories) {
  const manifest = JSON.parse(await readFile(`${root}/${directory}/package.json`, 'utf8'))
  packages.set(manifest.name, { directory, dependencies: Object.keys(manifest.dependencies ?? {}) })
}

function visit(name, path = []) {
  if (path.includes(name)) {
    failures.push(`package cycle: ${[...path.slice(path.indexOf(name)), name].join(' -> ')}`)
    return
  }
  const current = packages.get(name)
  if (!current) return
  for (const dependency of current.dependencies) {
    if (packages.has(dependency)) visit(dependency, [...path, name])
  }
}
for (const name of packages.keys()) visit(name)

for (const host of ['packages/host-userscript/src/index.ts', 'packages/host-webext/src/index.ts']) {
  const source = await readFile(`${root}/${host}`, 'utf8')
  if (!source.includes("from '@exlg/features'")) failures.push(`${host}: does not use the shared catalog`)
  if (!source.includes("from '@exlg/control-center'")) failures.push(`${host}: does not use the shared control center`)
}

const userscriptConfig = await readFile(`${root}/vite.userscript.config.ts`, 'utf8')
if (/@connect\s+\*/.test(userscriptConfig)) failures.push('vite.userscript.config.ts: contains @connect *')
for (const host of ['codeforces.com', 'kenkoooo.com', 'localhost', '127.0.0.1']) {
  if (!userscriptConfig.includes(`@connect      ${host}`)) failures.push(`vite.userscript.config.ts: missing exact @connect ${host}`)
}
const extensionManifest = JSON.parse(await readFile(`${root}/apps/extension/manifest.json`, 'utf8'))
const extensionHosts = extensionManifest.host_permissions ?? []
if (extensionHosts.includes('<all_urls>')) failures.push('extension manifest contains <all_urls>')
for (const pattern of ['https://codeforces.com/*', 'https://kenkoooo.com/*', 'http://localhost:27121/*', 'http://127.0.0.1:27121/*']) {
  if (!extensionHosts.includes(pattern)) failures.push(`extension manifest missing ${pattern}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}
else {
  console.log(`Boundary checks passed for ${packages.size} packages.`)
}
