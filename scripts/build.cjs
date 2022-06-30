#!/usr/bin/env node

const fs = require('node:fs/promises')
const esbuild = require('esbuild')
const babel = require('@babel/core')
const pkg = require('../package.json')

/* eslint-disable no-console */

const fail = (subject) => (err) => {
    console.error(`${subject} failed: %o`, err)
    process.exit(1)
}

;(async () => {
    await esbuild
        .build({
            entryPoints: ['src/index.ts'],
            format: 'iife',
            bundle: true,
            sourcemap: true,
            outfile: 'dist/bundle.js'
        })
        .catch(fail('Esbuild'))
    const bundled = await fs.readFile('./dist/bundle.js', 'utf-8')
    const babelResult = await babel
        .transformAsync(bundled, {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: 'ie 11'
                    }
                ]
            ],
            plugins: []
        })
        .catch(fail('Babel'))

    const header = await fs.readFile('./src/resources/header.js', 'utf-8')
    const headed = header.replace('{{version}}', pkg.version) + babelResult.code
    await fs.writeFile('./dist/bundle.js', headed)

    console.log('exlg is built successfully.')
})()
