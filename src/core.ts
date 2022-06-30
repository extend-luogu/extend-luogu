import { Utils } from '.'
import { defineStorage, Schema, Storage } from './storage'
import { evalScript, LoggerFunction, exlgLog } from './utils'

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
    module: ModuleRuntime,
    util: Utils,
    log: LoggerFunction,
    info: LoggerFunction,
    warn: LoggerFunction,
    error: LoggerFunction
) => ModuleExports

export interface ModuleRuntime {
    export?: (exports: ModuleWrapper) => void
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

const storage = defineStorage('modules', {})

const wrapModule = (module: Module) => `
exlg.modules['${module.id}'].exports(new Function(
    'self',
    'utils',
    'log', 'info', 'warn', 'error',
    ${JSON.stringify(module.script)}
))
`

export const installModule = (metadata: ModuleMetadata, script: string) => {
    const module: Module = {
        id: `${metadata.source}:${metadata.name}`,
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

export const executeModule = (module: Module, force = false) => {
    evalScript(wrapModule(module))
    new Promise((res: (wrapper: ModuleWrapper) => void) => {
        module.runtime.export = res
    }).then((wrapper: ModuleWrapper) => {
        const { log, info, warn, error } = exlgLog(
            `${module.id}@${module.metadata.version}`
        )
        const exports = wrapper(
            module.runtime,
            unsafeWindow.exlg.utils,
            log,
            info,
            warn,
            error
        )
        module.runtime.storage = defineStorage(module.id, exports.schema)
        if (force || checkWhetherToRunModule(exports)) {
            module.runtime.executeState = Promise.resolve(exports.entry())
        }
    })
}

export const launch = async () => {
    const modules: Modules = (unsafeWindow.exlg.modules = storage.getAll())

    for (const module of Object.values(modules)) {
        Object.freeze(module)
        if (module.active) executeModule(module)
    }
}
