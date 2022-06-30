import { Utils } from './utils'
import { defineStorage, Schema, Storage } from './storage'
import { evalScript, LoggerFunction, exlgLog } from './utils/utils'

export interface ModuleMetadata {
    name: string
    source: string
    version: string
    description: string
}

export interface ModuleExports {
    schema: Schema
    path: RegExp
    hook?: () => boolean
    entry: () => Promise<void> | void
}

export type ModuleWrapper = (
    exports: (e: ModuleExports) => void,
    module: ModuleRuntime,
    util: Utils,
    log: LoggerFunction,
    info: LoggerFunction,
    warn: LoggerFunction,
    error: LoggerFunction
) => ModuleExports

export interface ModuleRuntime {
    setWrapper?: (exports: ModuleWrapper) => void
    executeState?: Promise<void> | undefined
    storage?: Storage
}

export interface Module {
    id: string
    active?: boolean
    script: string
    metadata: ModuleMetadata
    runtime: ModuleRuntime
}
export type Modules = Record<string, Module>

let storage: Storage

const wrapModule = (module: Module) => `
exlg.modules['${module.id}'].runtime.setWrapper(new Function(
    'exports', 'self',
    'utils',
    'log', 'info', 'warn', 'error',
    ${JSON.stringify(module.script)}
))
`

export const installModule = (metadata: ModuleMetadata, script: string) => {
    const module: Module = {
        id: `${metadata.source}:${metadata.name}`,
        active: true,
        metadata,
        script,
        runtime: {}
    }
    storage.set(module.id, module)
}

export const checkWhetherToRunModule = (exports: ModuleExports) => {
    if (exports.path.test(unsafeWindow.location.href)) return true
    return false
}

export const executeModule = async (module: Module, force = false) => {
    const wrapper = await new Promise<ModuleWrapper>((res) => {
        module.runtime.setWrapper = (r) => {
            delete module.runtime.setWrapper
            res(r)
        }
        evalScript(wrapModule(module))
    })
    const { log, info, warn, error } = exlgLog(
        `${module.id}@${module.metadata.version}`
    )
    let exports: ModuleExports | null = null
    try {
        wrapper(
            (e) => (exports = e),
            module.runtime,
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

    module.runtime.storage = defineStorage(module.id, exports.schema)
    if (force || checkWhetherToRunModule(exports)) {
        log('Executing...')
        try {
            await exports.entry()
        } catch (err) {
            error('Failed to execute: %o', err)
        }
    }
}

const logger = exlgLog('core')

export const launch = async () => {
    logger.log('Launching...')

    storage = defineStorage('modules', {})
    const modules: Modules = (unsafeWindow.exlg.modules = storage.getAll())
    logger.log('Loaded `modules` storage.')

    const executeStates = []

    for (const module of Object.values(modules)) {
        Object.freeze(module)
        if (module.active)
            executeStates.push(
                (module.runtime.executeState = executeModule(module))
            )
    }

    await Promise.all(executeStates)
    logger.log('Launched.')
}

// Debug
Object.assign(unsafeWindow, {
    installModule,
    executeModule,
    checkWhetherToRunModule,
    wrapModule
})
