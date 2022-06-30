const fail = (subject) => (err) => {
    console.error(`${subject} failed: %o`, err)
    process.exit(1)
}

;(async () => {
    const esbuild = require('esbuild')
    await esbuild
        .build({
            entryPoints: ['src/index.ts'],
            format: 'iife',
            bundle: true,
            sourcemap: true,
            outfile: 'dist/bundle.js'
        })
        .catch(fail('Esbuild'))

    const babel = require('@babel/core')
    const fs = require('node:fs/promises')
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
    const pack = require('../package.json')
    const headed =
        header.replace('{{version}}', pack.version) + babelResult.code
    await fs.writeFile('./dist/bundle.js', headed)

    console.log('Succeed to build exlg.')
})()
