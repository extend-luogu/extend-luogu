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
    .description('创建一个新的 exlg 模块')
    .option('-o, --official', '作为官方包')
    .action(async (name, options) => {
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

        let scriptExt: 'ts' | 'js' | void
        let moduleExt: 'ts' | 'mjs' | void
        let typescript: boolean | void
        let useSchema: boolean | void

        if (useScript) {
            ;({ typescript, useSchema } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'typescript',
                    message: '是否使用 TypeScript?'
                },
                {
                    type: 'confirm',
                    name: 'useSchema',
                    message: '是否使用 Schema？'
                }
            ]))
            scriptExt = typescript ? 'ts' : 'js'
            moduleExt = typescript ? 'ts' : 'mjs'
        }

        await fs.mkdir(name)

        await fs.writeFile(
            path.resolve(name, 'package.json'),
            JSON.stringify(
                {
                    name: options.official
                        ? `@exlg/mod-${name}`
                        : `exlg-mod-${name}`,
                    description,
                    author,
                    version: '1.0.0',
                    main: useScript ? `src/index.${scriptExt}` : undefined,
                    keywords: ['exlg', 'exlg-module'],
                    scripts: {
                        build: 'exlg-mod build',
                        'build:dev': 'exlg-mod build -c',
                        prepublishOnly: 'exlg-mod clean && exlg-mod build'
                    },
                    dependencies: {
                        '@exlg/core':
                            (scriptExt === 'ts' &&
                                ((options.official && 'workspace:^') ||
                                    '^1.1.0')) ||
                            undefined,
                        schemastery: useSchema ? '^3.4.3' : undefined
                    },
                    devDependencies: {
                        '@exlg/cli-mod': '^1.1.1'
                    }
                },
                null,
                2
            )
        )

        await fs.mkdir(path.resolve(name, 'src'))
        await fs.mkdir(path.resolve(name, 'dist'))

        if (useScript) {
            const imports = []
            const main = []
            if (typescript) {
                imports.push("import '@exlg/core/types/module-entry'")
                main.push("log('hello exlg: Exlg!')")
            } else {
                main.push("log('hello exlg!') // your code here")
            }

            if (useSchema) {
                await fs.writeFile(
                    path.resolve(name, 'src', `schema.${moduleExt}`),
                    dedent`
                    import Schema from 'schemastery'

                    export default Schema.object({
                        // your static schema here
                        // see <https://github.com/shigma/schemastery>
                        hello: Schema.string().default('world')
                    })
                    ` + '\n'
                )

                if (typescript) {
                    imports.push(
                        "import type { SchemaToStorage } from '@exlg/core/types'",
                        "import type Scm from './schema'"
                    )
                    main.push(
                        'const sto = runtime.storage as SchemaToStorage<typeof Scm>',
                        "log('hello %s', sto.get('hello'))"
                    )
                } else {
                    main.push('const sto = runtime.storage')
                }
            }

            await fs.writeFile(
                path.resolve(name, 'src', `index.${scriptExt}`),
                imports.join('\n') + '\n\n' + main.join('\n') + '\n'
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
    .description('构建模块')
    .option('-c, --console', '提供用于手动注册模块的脚本')
    .action(async (options) => {
        if (!(await fileOk('./package.json'))) {
            return console.error('💥 当前目录没有 package.json，构建失败')
        }

        const pack = JSON.parse(await fs.readFile('./package.json', 'utf-8'))
        if (
            !['exlg-mod-', '@exlg/mod-'].some((prefix) =>
                pack.name.startsWith(prefix)
            )
        ) {
            const { con } = await inquirer.prompt({
                type: 'confirm',
                name: 'con',
                message:
                    '包名不是正确的官方或社区 npm 包名，可能不是正确的 exlg 模块，是否继续构建？',
                default: false
            })
            if (!con) return console.error('💥 构建中断')
        }

        console.log('🍀 开始构建')
        const startTime = Date.now()

        const exports: [string, string][] = []

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

            exports.push([
                'entry',
                `()=>{${await fs.readFile('./dist/bundle.js', 'utf-8')}}`
            ])

            const useSchema =
                (useJs && (await fileOk('./src/schema.mjs'))) ||
                (useTs && (await fileOk('./src/schema.ts')))

            if (useSchema) {
                await esbuild.build({
                    entryPoints: [`./src/schema.${useTs ? 'ts' : 'mjs'}`],
                    format: 'esm',
                    bundle: true,
                    outfile: 'dist/schema.mjs'
                })

                const schema = (
                    await import(
                        path.resolve(process.cwd(), 'dist', 'schema.mjs')
                    )
                ).default

                exports.push(['schema', JSON.stringify(schema)])
            }
        }

        const useCss = await fileOk('./src/index.css')
        if (useCss) {
            exports.push([
                'style',
                JSON.stringify(await fs.readFile('./src/index.css', 'utf-8'))
            ])
        }

        if (!useJs && !useTs && !useCss) {
            return console.error('💥 未找到任何脚本或样式入口点，构建失败')
        }

        const exportString = exports.map(([k, v]) => `"${k}":${v}`).join(',')
        const define = `define({${exportString}})`

        await fs.writeFile('./dist/module.min.js', define)

        if (options.console) {
            await fs.writeFile('./dist/module.define.js', define)

            await fs.writeFile(
                './dist/module.install.js',
                `if (exlg.moduleCtl) exlg.moduleCtl.installModule(${JSON.stringify(
                    {
                        name: pack.name,
                        version: pack.version,
                        description: pack.description,
                        source: 'console'
                    }
                )}, ${JSON.stringify(define)})\n` +
                    'else console.log("请打开 exlg 调试模式")'
            )
        }

        console.log('⚡️ 构建完成，花费 %d 毫秒', Date.now() - startTime)
    })

program
    .command('clean')
    .description('清理构建')
    .action(async () => {
        await fs.rm('./dist', { recursive: true })
        await fs.mkdir('./dist')

        console.log('⚡ 清理完成')
    })

program
    .command('serve')
    .description('启动调试源服务（暂不可用）')
    .option('-p, --port', '端口')
    .action((options) => {
        console.log(options.port)
    })

program.parse(process.argv)
