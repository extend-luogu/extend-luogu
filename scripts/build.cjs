#!/usr/bin/env node

const fs = require('node:fs/promises')
const esbuild = require('esbuild')
const vuePlugin = require('esbuild-plugin-vue3')
const pkg = require('../package.json')

/* eslint-disable no-console */

const fail = (err) => {
    console.error(`Failed %o`, err)
    process.exit(1)
}

;(async () => {
    const startTime = Date.now()

    console.log('Building core...')
    await esbuild
        .build({
            entryPoints: ['src/core/index.ts'],
            format: 'iife',
            bundle: true,
            minify: true,
            outfile: 'dist/core.bundle.js'
        })
        .catch(fail)

    console.log('Building dash...')
    await esbuild
        .build({
            entryPoints: ['src/dash/src/main.ts'],
            plugins: [vuePlugin()],
            format: 'iife',
            bundle: true,
            minify: true,
            outfile: 'dist/dash.bundle.js'
        })
        .catch(fail)

    console.log('Concating... (header + dash + core)')
    try {
        const header = await fs.readFile('./resources/header.js', 'utf-8')
        const coreJs = await fs.readFile('./dist/core.bundle.js', 'utf-8')
        const dashJs = await fs.readFile('./dist/dash.bundle.js', 'utf-8')
        const dashCss = await fs.readFile('./dist/dash.bundle.css', 'utf-8')

        const injectResource = (name, str) =>
            `\n;unsafeWindow.exlgResources.${name} = ${JSON.stringify(str)};\n`

        const concated = `${header.replace(
            '{{version}}',
            pkg.version
        )}\n;unsafeWindow.exlgResources = {};\n${injectResource(
            'dashJs',
            dashJs
        )}${injectResource('dashCss', dashCss)}\n${coreJs}`
        await fs.writeFile('./dist/core.bundle.js', concated)
    } catch (err) {
        fail(err)
    }

    console.log('Exlg builded in %d ms.', Date.now() - startTime)
})()
