import { Utils } from './utils'
import { defineStorage, Schema, Storage } from './storage'
import {
    loadJs,
    LoggerFunction,
    exlgLog,
    loadCss,
    MatchError
} from './utils/utils'

export interface ModuleMetadata {
    name: string
    source: string
    version: string
    description: string
}

export interface ModuleExports {
    style?: string
    schema: Schema
    entry?: () => Promise<void> | void
}

export type ModuleWrapper = (
    define: (e: ModuleExports) => void,
    runtime: ModuleRuntime,
    Schema: Schema.Static,
    utils: Utils,
    log: LoggerFunction,
    info: LoggerFunction,
    warn: LoggerFunction,
    error: LoggerFunction
) => ModuleExports

export interface ModuleRuntime {
    setWrapper?: (wrapper: ModuleWrapper) => void
    executeState?: Promise<void> | undefined
    storage?: Storage
}

export interface ModuleReadonly {
    id: string
    active?: boolean
    script: string
    metadata: ModuleMetadata
}

export interface Module extends ModuleReadonly {
    runtime: ModuleRuntime
}
export type Modules = Record<string, Module>
export type ModulesReadonly = Record<string, ModuleReadonly>

let storage: Storage<ModulesReadonly>

const wrapModule = (module: Module) => `
exlg.modules['${module.id}'].runtime.setWrapper(new Function(
    'define', 'runtime', 'Schema',
    'utils',
    'log', 'info', 'warn', 'error',
    ${JSON.stringify(module.script)}
))
`

export const installModule = (metadata: ModuleMetadata, script: string) => {
    const module: ModuleReadonly = {
        id: `${metadata.source}:${metadata.name}`,
        active: true,
        metadata,
        script
    }
    storage.set(module.id, module)
}

export const executeModule = async (module: Module) => {
    const wrapper = await new Promise<ModuleWrapper>((res) => {
        module.runtime.setWrapper = (r) => {
            delete module.runtime.setWrapper
            res(r)
        }
        loadJs(wrapModule(module))
    })
    const { log, info, warn, error } = exlgLog(
        `module/${module.id}@${module.metadata.version}`
    )
    let exports: ModuleExports | null = null
    try {
        wrapper(
            (e) => (exports = e),
            module.runtime,
            Schema,
            unsafeWindow.exlg.utils,
            log,
            info,
            warn,
            error
        )
    } catch (err) {
        error('Failed to unwrap: %o', err)
        return
    }

    exports = exports as ModuleExports | null

    if (!exports) {
        error('Exports not found.')
        return
    }

    if (exports.schema)
        module.runtime.storage = defineStorage(
            module.id,
            Schema(exports.schema)
        )

    if (!module.active) return

    try {
        await exports.entry?.()
    } catch (err) {
        if (err instanceof MatchError) return
        error('Failed to execute: %o', err)
    }
    log('Executed.')

    if (exports.style) {
        loadCss(exports.style)
        log('Style loaded.')
    }
}

const logger = exlgLog('core')

export interface ModuleCtl {
    storage: Storage<ModulesReadonly>
    installModule: typeof installModule
    executeModule: typeof executeModule
}

const loadDash = () => {
    unsafeWindow.exlg.moduleCtl = {
        storage,
        installModule,
        executeModule
    }

    const dashRoot = unsafeWindow.document.createElement('div')
    dashRoot.id = 'exlg-dash'
    unsafeWindow.document.body.appendChild(dashRoot)
    loadCss(unsafeWindow.exlgResources.dashCss)
    loadJs(unsafeWindow.exlgResources.dashJs)
    logger.log('Loaded dash. (exposed to window.exlgDash)')
}

export const launch = async () => {
    logger.log('Launching... (exposed to window.exlg)')

    storage = defineStorage(
        'modules',
        Schema.dict(
            Schema.object({
                id: Schema.string().required(),
                active: Schema.boolean(),
                script: Schema.string().required(),
                metadata: Schema.object({
                    name: Schema.string().required(),
                    source: Schema.string().required(),
                    version: Schema.string().required(),
                    description: Schema.string().required()
                }).required()
            }).required()
        ).required()
    ) as Storage<ModulesReadonly> // hack SNC

    const modules = storage.getAll()
    unsafeWindow.exlg.modules = {}
    for (const id in modules) {
        unsafeWindow.exlg.modules[id] = {
            ...modules[id],
            runtime: {}
        }
    }

    logger.log('Loaded `modules` storage.')

    loadDash()

    const executeStates = []

    for (const module of Object.values(exlg.modules)) {
        Object.freeze(module)
        executeStates.push(
            (module.runtime.executeState = executeModule(module))
        )
    }

    await Promise.all(executeStates)
    logger.log('Launched.')
}
