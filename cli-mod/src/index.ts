#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { constants as fsConst } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Command } from 'commander'
import inquirer from 'inquirer'
import dedent from 'dedent'
import esbuild from 'esbuild'
import { version } from '../package.json'

const fileOk = async (file: string) => {
    try {
        await fs.access(file, fsConst.F_OK)
        return true
    } catch {
        return false
    }
}

const program = new Command('exlg-mod')

program.version(version)

program
    .command('create <mod-name>')
    .description('create a new exlg module')
    .action(async (name) => {
        const { description, author } = await inquirer.prompt([
            {
                type: 'input',
                name: 'description',
                message: `简要描述一下模块 ${name} 的用途？`
            },
            {
                type: 'input',
                name: 'author',
                message: '作者？'
            }
        ])

        const { langs } = await inquirer.prompt({
            type: 'checkbox',
            name: 'langs',
            message: '你的模块会带来哪些特性？',
            choices: ['脚本 script', '样式 style'],
            validate: (input) => !!input.length
        })

        const useScript = langs.includes('脚本 script')
        const useStyle = langs.includes('样式 style')

        let scriptExt
        if (useScript)
            scriptExt = (
                await inquirer.prompt({
                    type: 'confirm',
                    name: 'typescript',
                    message: '是否使用 TypeScript?'
                })
            ).typescript
                ? 'ts'
                : 'js'

        await fs.mkdir(name)

        await fs.writeFile(
            path.resolve(name, 'package.json'),
            JSON.stringify(
                {
                    name: `exlg-mod-${name}`,
                    description,
                    author,
                    version: '1.0.0',
                    main: useScript ? `src/index.${scriptExt}` : undefined,
                    devDependencies: {
                        '@exlg/cli-mod': '^1.0.0',
                        '@exlg/core': scriptExt === 'ts' ? '^1.0.0' : undefined
                    }
                },
                null,
                2
            )
        )

        await fs.mkdir(path.resolve(name, 'src'))
        await fs.mkdir(path.resolve(name, 'dist'))

        if (useScript) {
            await fs.writeFile(
                path.resolve(name, 'src', `index.${scriptExt}`),
                scriptExt === 'js'
                    ? dedent`
                        const sto = runtime.storage
                        log('hello exlg!') // your code here
                    `
                    : dedent`
                        import 'exlg-core/types/module-entry'
                        const sto = runtime.storage
                        log('hello exlg: Exlg!')
                    `
            )

            if (scriptExt === 'ts') {
                await fs.writeFile(
                    path.resolve(name, 'tsconfig.json'),
                    JSON.stringify(
                        {
                            compilerOptions: {
                                target: 'es6',
                                lib: ['esnext', 'dom'],
                                module: 'commonjs',
                                esModuleInterop: true,
                                forceConsistentCasingInFileNames: true,
                                strict: true
                            },
                            include: ['./src/']
                        },
                        null,
                        2
                    )
                )
            }
        }

        if (useStyle)
            await fs.writeFile(
                path.resolve(name, 'src', 'index.css'),
                dedent`
                    /* your code here */
                `
            )
    })

program
    .command('build')
    .description('build the module')
    .action(async () => {
        console.log('Building...')
        const startTime = Date.now()

        const exports: {
            entry?: string
            style?: string
        } = {}

        const useJs = await fileOk('./src/index.js')
        const useTs = await fileOk('./src/index.ts')
        if (useJs || useTs) {
            await esbuild.build({
                entryPoints: [`./src/index.${useTs ? 'ts' : 'js'}`],
                format: 'iife',
                bundle: true,
                minify: true,
                outfile: 'dist/bundle.js'
            })
            exports.entry = await fs.readFile('./dist/bundle.js', 'utf-8')
        }

        if (await fileOk('./src/index.css')) {
            exports.style = await fs.readFile('./src/index.css', 'utf-8')
        }

        await fs.writeFile(
            './dist/module.min.js',
            `exports(${JSON.stringify(exports)})`
        )

        console.log('Done in %d ms.', Date.now() - startTime)
    })

program
    .command('serve')
    .description('serve a module source at localhost')
    .option('-p, --port')
    .action((options) => {
        console.log(options.port)
    })

program.parse(process.argv)
