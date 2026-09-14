import { access, readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []
const localDomNamespaces = new Set([
  'http://www.w3.org/1998/Math/MathML',
  'http://www.w3.org/1999/xhtml',
  'http://www.w3.org/2000/svg',
])
const inertDependencyUrls = new Set([
  'https://en.wikibooks.org/wiki/LaTeX/Lengths',
  'https://github.com/markedjs/marked.',
  'https://tex.stackexchange.com/a/41371',
  'https://tex.stackexchange.com/a/8263',
  'https://tex.stackexchange.com/questions/1930/when-should-one-',
])
const userscriptDirectory = `${root}/dist/userscript`
const userscriptFiles = (await readdir(userscriptDirectory)).filter(name => name.endsWith('.user.js'))
if (userscriptFiles.length !== 1) failures.push(`expected one .user.js, found ${userscriptFiles.length}`)
else {
  const source = await readFile(`${userscriptDirectory}/${userscriptFiles[0]}`, 'utf8')
  if (!source.startsWith('// ==UserScript==')) failures.push('userscript metadata is not the first content')
  const connections = [...source.matchAll(/^\/\/\s+@connect\s+(.+)$/gm)].map(match => match[1]?.trim())
  const expectedConnections = ['codeforces.com', 'kenkoooo.com', 'localhost', '127.0.0.1']
  if (JSON.stringify(connections) !== JSON.stringify(expectedConnections)) failures.push(`unexpected userscript @connect list: ${JSON.stringify(connections)}`)
  if (connections.includes('*')) failures.push('userscript declares @connect *')
  if (/\b(?:eval\s*\(|new\s+Function\b)/.test(source)) failures.push('userscript contains dynamic code execution')
  if (!source.includes('exlg-next-control-center-host')) failures.push('userscript does not contain Control Center')
  if (!source.includes('official.private-message-notifier')) failures.push('userscript does not contain private-message Feature')
  if (!source.includes('official.chat-markdown')) failures.push('userscript does not contain chat Markdown Feature')
  if (!source.includes('official.import-to-cph')) failures.push('userscript does not contain migration-wave Features')
  if (/window\.exlgDash\b/.test(source)) failures.push('userscript exposes legacy dashboard global')
}

const extensionDirectory = `${root}/dist/extension`
for (const name of ['manifest.json', 'content.js', 'history-bridge.js', 'network-broker.js']) {
  try { await access(`${extensionDirectory}/${name}`) }
  catch { failures.push(`missing extension artifact: ${name}`) }
}
const manifest = JSON.parse(await readFile(`${extensionDirectory}/manifest.json`, 'utf8'))
if (manifest.manifest_version !== 3) failures.push('extension manifest is not MV3')
if (JSON.stringify(manifest.permissions) !== JSON.stringify(['storage', 'clipboardWrite'])) {
  failures.push(`unexpected extension permissions: ${JSON.stringify(manifest.permissions)}`)
}
const expectedHostPermissions = [
  'https://codeforces.com/*', 'https://kenkoooo.com/*',
  'http://localhost:27121/*', 'http://127.0.0.1:27121/*',
]
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(expectedHostPermissions)) {
  failures.push(`unexpected extension host permissions: ${JSON.stringify(manifest.host_permissions)}`)
}
if (manifest.host_permissions?.includes('<all_urls>')) failures.push('extension contains <all_urls>')
if (manifest.background?.service_worker !== 'network-broker.js') failures.push('extension network broker is not registered')
for (const name of ['content.js', 'history-bridge.js', 'network-broker.js']) {
  const source = await readFile(`${extensionDirectory}/${name}`, 'utf8')
  if (/\b(?:eval\s*\(|new\s+Function\b)/.test(source)) failures.push(`${name} contains dynamic code execution`)
  const urls = [...source.matchAll(/https?:\/\/[^'"`\s)]+/g)].map(match => match[0])
  const unexpected = urls.filter(url => !localDomNamespaces.has(url) && !inertDependencyUrls.has(url)
    && !['https://codeforces.com', 'https://kenkoooo.com', 'https://atcoder.jp', 'http://localhost:27121', 'http://127.0.0.1:27121', 'https://www.luogu.com.cn'].some(origin => url.startsWith(origin)))
  if (unexpected.length > 0) failures.push(`${name} contains an unexpected remote URL: ${unexpected[0]}`)
}
const extensionContent = await readFile(`${extensionDirectory}/content.js`, 'utf8')
if (!extensionContent.includes('exlg-next-control-center-host')) failures.push('extension does not contain Control Center')
if (!extensionContent.includes('official.private-message-notifier')) failures.push('extension does not contain private-message Feature')
if (!extensionContent.includes('official.chat-markdown')) failures.push('extension does not contain chat Markdown Feature')
if (!extensionContent.includes('official.import-to-cph')) failures.push('extension does not contain migration-wave Features')
if (/window\.exlgDash\b/.test(extensionContent)) failures.push('extension exposes legacy dashboard global')

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}
else {
  console.log('Installable artifact checks passed.')
}
