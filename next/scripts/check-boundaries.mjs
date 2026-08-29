import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function filesBelow(relative, extension = '.ts') {
  const result = []
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = `${path}/${entry.name}`
      if (entry.isDirectory()) await walk(child)
      else if (entry.name.endsWith(extension)) result.push(child)
    }
  }
  await walk(`${root}/${relative}`)
  return result
}

function fail(file, message) {
  failures.push(`${file.slice(root.length + 1)}: ${message}`)
}

for (const file of await filesBelow('features')) {
  if (file.endsWith('catalog.ts')) continue
  const source = await readFile(file, 'utf8')
  const forbidden = /\b(?:window|document|unsafeWindow|chrome|browser|eval|GM_[A-Za-z0-9_]+)\b|new\s+Function\b/g
  for (const match of source.matchAll(forbidden)) fail(file, `forbidden feature global: ${match[0]}`)
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (match[1] !== '@exlg/runtime') fail(file, `feature import must use public @exlg/runtime: ${match[1]}`)
  }
}

for (const file of await filesBelow('packages/runtime/src')) {
  const source = await readFile(file, 'utf8')
  const forbidden = /\b(?:window|document|unsafeWindow|chrome|browser|GM_[A-Za-z0-9_]+)\b/g
  for (const match of source.matchAll(forbidden)) fail(file, `forbidden runtime global: ${match[0]}`)
}

for (const file of await filesBelow('.')) {
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
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}
else {
  console.log(`Boundary checks passed for ${packages.size} packages.`)
}
