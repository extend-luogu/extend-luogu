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
import packageJson from 'package-json'
import yaml from 'js-yaml'
import { version } from '../package.json'

const fileOk = async (file: string) => {
    try {
        await fs.access(file, fsConst.F_OK)
        return true
    } catch {
        return false
    }
}

const checkPkgFile = async (op: string) => {
    if (!(await fileOk('./package.json'))) {
        return console.error(`💥 当前目录没有 package.json，${op}失败`)
    }

    const pkg = JSON.parse(await fs.readFile('./package.json', 'utf-8'))
    if (
        !['exlg-mod-', '@exlg/mod-', 'exlg-theme-', '@exlg/theme-'].some(
            (prefix) => pkg.name.startsWith(prefix)
        )
    ) {
        const { con } = await inquirer.prompt({
            type: 'confirm',
            name: 'con',
            message: `包名不是正确的官方或社区 npm 包名，可能不是正确的 exlg 模块，是否继续${op}？`,
            default: false
        })
        if (!con) return console.error(`💥 ${op}中断`)
    }

    return pkg
}

const checkPkgVer = async (name: string) => {
    try {
        return (await packageJson(name)).version
    } catch {
        return undefined
    }
}

const pkgNameToModName = (pkgName: string) =>
    pkgName.replace(/^(@exlg\/|exlg-)(mod|theme)-/, '')

const program = new Command('exlg-mod')

program.version(version)

program
    .command('create <mod-name>')
    .description('创建一个新的 exlg 模块')
    .option('-o, --official', '作为官方包')
    .option('-t, --theme', '作为主题模块')
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
        let useVue: boolean | void
        let useSchema: boolean | void

        if (useScript) {
            ;({ typescript, useVue, useSchema } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'typescript',
                    message: '是否使用 TypeScript?'
                },
                {
                    type: 'confirm',
                    name: 'useVue',
                    message: '是否使用 Vue？',
                    default: false
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

        const prefix = options.theme ? 'theme' : 'mod'
        await fs.writeFile(
            path.resolve(name, 'package.json'),
            JSON.stringify(
                {
                    name: options.official
                        ? `@exlg/${prefix}-${name}`
                        : `exlg-${prefix}-${name}`,
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
                                    '^1.3.0')) ||
                            undefined,
                        schemastery: useSchema ? '^3.4.3' : undefined
                    },
                    devDependencies: {
                        '@exlg/cli-mod': '^1.1.1',
                        vue: useVue ? '^3.2.37' : undefined
                    }
                },
                null,
                4
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

            if (useVue) {
                imports.push("import App from './App.vue'")

                main.push(
                    '',
                    'const { Vue } = window.exlgDash',
                    'const { createApp } = Vue',
                    "createApp(App).mount('#id') // mount the app to the element you want"
                )

                await fs.writeFile(
                    path.resolve(name, 'src', 'App.vue'),
                    dedent`
                        <script setup${typescript ? ' lang="ts"' : ''}>
                        import '@exlg/core/types'

                        const { Vue } = window.exlgDash
                        const { ref } = Vue

                        const count = ref(0)
                        </script>

                        <template>
                            <div>
                                <p>You clicked {{ count }} times</p>
                                <button class="exlg-button" @click="count++">+1s</button>
                            </div>
                        </template>

                        <style>
                            /* style is OK, but not scoped */
                        </style>
                    `
                )
            }

            await fs.writeFile(
                path.resolve(name, 'src', `index.${scriptExt}`),
                imports.join('\n') + '\n\n' + main.join('\n') + '\n'
            )

            if (scriptExt === 'ts') {
                await fs.writeFile(
                    path.resolve(name, 'tsconfig.json'),
                    JSON.stringify(
                        useVue
                            ? {
                                  compilerOptions: {
                                      target: 'es6',
                                      useDefineForClassFields: true,
                                      module: 'esnext',
                                      moduleResolution: 'node',
                                      strict: true,
                                      jsx: 'preserve',
                                      sourceMap: true,
                                      resolveJsonModule: true,
                                      isolatedModules: true,
                                      esModuleInterop: true,
                                      lib: ['esnext', 'dom'],
                                      skipLibCheck: true
                                  },
                                  include: [
                                      'src/**/*.ts',
                                      'src/**/*.d.ts',
                                      'src/**/*.tsx',
                                      'src/**/*.vue'
                                  ]
                              }
                            : {
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
                        4
                    )
                )

                if (useVue) {
                    await fs.writeFile(
                        path.resolve(name, 'src', 'env.d.ts'),
                        dedent`
                            declare module '*.vue' {
                                import type { DefineComponent } from 'vue'
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
                                const component: DefineComponent<{}, {}, any>
                                export default component
                            }
                        `
                    )
                }
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
    .option('-m, --minify', '最小化', false)
    .action(async (options) => {
        const pkg = await checkPkgFile('构建')

        console.log('🍀 开始构建')
        const startTime = Date.now()

        const exports: [string, string][] = []
        const entryPoints = []
        const plugins = []

        const useJs = await fileOk('./src/index.js')
        const useTs = await fileOk('./src/index.ts')
        const useCss = await fileOk('./src/index.css')

        if (useCss) entryPoints.push('./src/index.css')
        if (useJs || useTs) {
            const useVue = await fileOk('./src/App.vue')

            if (useVue) {
                const vuePlugin = await import('esbuild-plugin-vue3')
                plugins.push(vuePlugin.default() as esbuild.Plugin)
            }

            entryPoints.push(`./src/index.${useTs ? 'ts' : 'js'}`)

            const useSchema =
                (useJs && (await fileOk('./src/schema.mjs'))) ||
                (useTs && (await fileOk('./src/schema.ts')))

            if (useSchema) {
                await esbuild.build({
                    entryPoints: [`./src/schema.${useTs ? 'ts' : 'mjs'}`],
                    format: 'esm',
                    charset: 'utf8',
                    outfile: 'dist/schema.mjs'
                })

                const schema = (
                    await import(
                        'file://' +
                            path.resolve(process.cwd(), 'dist', 'schema.mjs')
                    )
                ).default

                exports.push(['schema', JSON.stringify(schema)])
            }
        }

        await esbuild.build({
            entryPoints,
            format: 'iife',
            charset: 'utf8',
            bundle: true,
            minify: options.minify,
            plugins,
            outdir: 'dist'
        })

        if (await fileOk('./dist/index.js'))
            exports.push([
                'entry',
                `()=>{${await fs.readFile('./dist/index.js', 'utf-8')}}`
            ])

        if (await fileOk('./dist/index.css'))
            exports.push([
                'style',
                JSON.stringify(await fs.readFile('./dist/index.css', 'utf-8'))
            ])

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
                        name: pkg.name,
                        version: pkg.version,
                        description: pkg.description,
                        display: pkg.name,
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
        if (await fileOk('./dist')) await fs.rm('./dist', { recursive: true })
        await fs.mkdir('./dist')

        console.log('⚡ 清理完成')
    })

program
    .command('registry')
    .description('为当前模块生成 yaml 格式的 registry')
    .action(async () => {
        const pkg = await checkPkgFile('生成')

        const registry = {
            name: pkgNameToModName(pkg.name),
            display: pkg.display,
            description: pkg.description,
            type: 'npm',
            package: pkg.name,
            bin: 'dist/module.min.js',
            versions: [pkg.version]
        }

        console.log(yaml.dump(registry))
    })

program
    .command('add <mod-name>')
    .description('添加依赖')
    .action(async (name) => {
        const pkg = await checkPkgFile('添加依赖')

        if (!pkg.exlgDependencies) pkg.exlgDependencies = {}

        const official = await checkPkgVer(`@exlg/mod-${name}`)
        const third = await checkPkgVer(`exlg-mod-${name}`)

        if (official) pkg.exlgDependencies[`@exlg/mod-${name}`] = `^${official}`
        else if (third) pkg.exlgDependencies[`exlg-mod-${name}`] = `^${third}`
        else return console.error('💥 未找到匹配的依赖，添加依赖失败')

        pkg.exlgDependencies = Object.fromEntries(
            Object.entries(pkg.exlgDependencies).sort()
        )
        await fs.writeFile(
            './package.json',
            JSON.stringify(
                Object.fromEntries(Object.entries(pkg).sort()),
                null,
                4
            )
        )

        console.log(
            '⚡ 添加依赖：%s',
            official
                ? `@exlg/mod-${name} ^${official}`
                : `exlg-mod-${name} ^${third}`
        )
    })

program.parse(process.argv)
