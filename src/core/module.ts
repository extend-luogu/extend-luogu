import { defineStorage, Schema, Storage } from './storage'
import { utils, type Utils } from './utils/packed'
import type { LoggerFunction } from './utils'

export interface ModuleDependencies {
    [mod: string]: string | undefined
    core?: string
}

export interface ModuleMetadata {
    name: string
    source: string
    version: string
    description: string
    display: string
    dependencies: ModuleDependencies
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

export enum ExecuteState {
    Done,
    Inactive,
    MissDependeny,
    Threw,
    Mismatched,
    StorageBroken,
    NotExported,
    UnwrapThrew,
}

export interface ModuleInterface {
    description: string
    fn: () => void
}

export type ModuleInterfaces = Record<string, ModuleInterface>

export interface ModuleRuntime {
    setWrapper?: (wrapper: ModuleWrapper) => void
    executeState?: Promise<ExecuteState> | undefined
    storage?: Storage
    interfaces: ModuleInterfaces
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

export enum InstallState {
    uninstalled,
    installed,
    installing,
    installFailed,
}

export type SourceVersion = {
    version: string
    dependencies: ModuleDependencies
}

export interface SourceItem {
    id: string
    name: string
    description: string
    versions: SourceVersion[]
    selectedVersion: SourceVersion
    display: string
    bin: string
}
export interface NpmSourceItem extends SourceItem {
    type: 'npm'
    package: string
}
export type AllSourceItem = NpmSourceItem
export type Registry = AllSourceItem[]

const {
    loadJs, loadCss, exlgLog, MatchError,
} = utils

let modulesStorage: Storage<ModulesReadonly>
export const initModulesStorage = (storage: Storage<ModulesReadonly>) => modulesStorage = storage

export const moduleStorages: Record<string, Storage> = {}

const wrapModule = (module: Module) => `
exlg.modules['${module.id}'].runtime.setWrapper(function(
    define, runtime, Schema,
    utils,
    log, info, warn, error
) {
    ${module.script}
})
`

export const installModule = (metadata: ModuleMetadata, script: string) => {
    const module: ModuleReadonly = {
        id: metadata.name,
        active: true,
        metadata,
        script,
    }
    modulesStorage.set(module.id, module)
    const { modules } = unsafeWindow.exlg
    modules[module.id] = {
        ...module,
        runtime: { interfaces: {} },
    }
    modules[module.id].runtime.executeState = executeModule(modules[module.id])
}

export const executeModule = async (module: Module): Promise<ExecuteState> => {
    if (!isDependenciesOk(module.metadata.dependencies)) {
        return ExecuteState.MissDependeny
    }

    const wrapper = await new Promise<ModuleWrapper>((res) => {
        module.runtime.setWrapper = (r) => {
            delete module.runtime.setWrapper
            res(r)
        }
        loadJs(wrapModule(module))
    })
    const {
        log, info, warn, error,
    } = exlgLog(
        `module/${module.id}@${module.metadata.version}`,
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
            error,
        )
    }
    catch (err) {
        error('Failed to unwrap: %o', err)
        return ExecuteState.UnwrapThrew
    }

    exports = exports as ModuleExports | null

    if (!exports) {
        error('Exports not found.')
        return ExecuteState.NotExported
    }

    if (exports.schema) {
        moduleStorages[module.id] = module.runtime.storage = defineStorage(
            module.id,
            Schema(exports.schema),
        )
    }

    if (!module.active) return ExecuteState.Inactive

    try {
        await exports.entry?.()
    }
    catch (err) {
        if (err instanceof MatchError) return ExecuteState.Mismatched
        error('Failed to execute: %o', err)
        return ExecuteState.Threw
    }
    log('Executed.')

    if (exports.style) {
        loadCss(exports.style)
        log('Style loaded.')
    }

    return ExecuteState.Done
}

export const isDependenciesOk = (dep?: ModuleDependencies) => {
    if (!dep) return true
    if (dep.core && !utils.semver.satisfies(exlg.coreVersion, dep.core)) return false
    return true
}

export interface ModuleControl {
    modulesStorage: Storage<ModulesReadonly>
    moduleStorages: Record<string, Storage>
    installModule: typeof installModule
    InstallStates: typeof InstallState
    executeModule: typeof executeModule
    ExecuteStates: typeof ExecuteState
    isDependenciesOk: typeof isDependenciesOk
}
