#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs/promises')
const esbuild = require('esbuild')
const vuePlugin = require('esbuild-plugin-vue3')
const pkg = require('../package.json')

exports = async () => {
    const startTime = Date.now()
    const minify = process.env.MINIFY !== '0'

    console.log('Building core...')
    await esbuild.build({
        entryPoints: ['src/core/index.ts'],
        format: 'iife',
        bundle: true,
        minify,
        outfile: 'dist/core.bundle.js'
    })

    // Let esbuild-plugin-vue3 know which `tsconfig.json` to use.
    // See <https://github.com/pipe01/esbuild-plugin-vue3/issues/6>
    process.chdir('src/dash')

    console.log('Building dash...')
    await esbuild.build({
        entryPoints: ['src/main.ts'],
        plugins: [vuePlugin()],
        format: 'iife',
        bundle: true,
        minify,
        outfile: 'dist/dash.bundle.js'
    })

    process.chdir('../..')

    console.log('Concating... (header + dash + core)')
    const header = await fs.readFile('./resources/header.js', 'utf-8')
    const coreJs = await fs.readFile('./dist/core.bundle.js', 'utf-8')
    const coreCss = await fs.readFile('./dist/core.bundle.css', 'utf-8')
    const dashJs = await fs.readFile('./dist/dash.bundle.js', 'utf-8')
    const dashCss = await fs.readFile('./dist/dash.bundle.css', 'utf-8')

    const injectResource = (name, str) =>
        `\n;unsafeWindow.exlgResources.${name} = ${JSON.stringify(str)};\n`

    const concated =
        // eslint-disable-next-line prefer-template
        header.replace('{{version}}', pkg.version) +
        `\n;unsafeWindow.exlgResources = {};\n` +
        injectResource('dashJs', dashJs) +
        injectResource('dashCss', dashCss) +
        `\n${coreJs}\n` +
        `\n;GM_addStyle(${JSON.stringify(coreCss)});\n`
    await fs.writeFile('./dist/extend-luogu.min.user.js', concated)

    console.log('Built exlg in %d ms.', Date.now() - startTime)
}

try {
    exports()
} catch (err) {
    console.error('Failed to build exlg: %o', err)
}
