import { access, readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []
const userscriptDirectory = `${root}/dist/userscript`
const userscriptFiles = (await readdir(userscriptDirectory)).filter(name => name.endsWith('.user.js'))
if (userscriptFiles.length !== 1) failures.push(`expected one .user.js, found ${userscriptFiles.length}`)
else {
  const source = await readFile(`${userscriptDirectory}/${userscriptFiles[0]}`, 'utf8')
  if (!source.startsWith('// ==UserScript==')) failures.push('userscript metadata is not the first content')
  if (source.includes('@connect')) failures.push('userscript declares @connect')
  if (/\b(?:eval\s*\(|new\s+Function\b)/.test(source)) failures.push('userscript contains dynamic code execution')
}

const extensionDirectory = `${root}/dist/extension`
for (const name of ['manifest.json', 'content.js', 'history-bridge.js']) {
  try { await access(`${extensionDirectory}/${name}`) }
  catch { failures.push(`missing extension artifact: ${name}`) }
}
const manifest = JSON.parse(await readFile(`${extensionDirectory}/manifest.json`, 'utf8'))
if (manifest.manifest_version !== 3) failures.push('extension manifest is not MV3')
if (JSON.stringify(manifest.permissions) !== JSON.stringify(['storage', 'clipboardWrite'])) {
  failures.push(`unexpected extension permissions: ${JSON.stringify(manifest.permissions)}`)
}
for (const name of ['content.js', 'history-bridge.js']) {
  const source = await readFile(`${extensionDirectory}/${name}`, 'utf8')
  if (/\b(?:eval\s*\(|new\s+Function\b)/.test(source)) failures.push(`${name} contains dynamic code execution`)
  const urls = [...source.matchAll(/https?:\/\/[^'"`\s)]+/g)].map(match => match[0])
  const unexpected = urls.filter(url => !url.startsWith('https://cdn.luogu.com.cn/upload/usericon/'))
  if (unexpected.length > 0) failures.push(`${name} contains an unexpected remote URL: ${unexpected[0]}`)
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}
else {
  console.log('Installable artifact checks passed.')
}
