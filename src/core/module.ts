import { defineStorage, Schema, Storage } from './storage'
import { utils, type Utils } from './utils/packed'
import type { LoggerFunction } from './utils'
import type { ModuleInjection } from '.'

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
    error: LoggerFunction,
    inject: <T>(moduleId: string) => Promise<T | undefined>,
) => ModuleExports

export enum ExecuteState {
    Done,
    Inactive,
    MissDependency,
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
    exports?: Promise<object> | undefined
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

let modulesStorage: Storage<ModulesReadonly>
export const initModulesStorage = (storage: Storage<ModulesReadonly>) => modulesStorage = storage

export const moduleStorages: Record<string, Storage> = {}

const wrapModule = (module: Module) => `
exlg.modules['${module.id}'].runtime.setWrapper(function(
    define, runtime, Schema,
    utils,
    log, info, warn, error,
    inject
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

export const isBroken = (st: ExecuteState) => [
    ExecuteState.MissDependency,
    ExecuteState.NotExported,
    ExecuteState.StorageBroken,
    ExecuteState.Threw,
    ExecuteState.UnwrapThrew,
].includes(st)

export const executeModule = async (module: Module): Promise<ExecuteState> => {
    if (!checkDependencies(module.metadata.dependencies)[0]) {
        return ExecuteState.MissDependency
    }

    const wrapper = await new Promise<ModuleWrapper>((res) => {
        module.runtime.setWrapper = (r) => {
            delete module.runtime.setWrapper
            res(r)
        }
        utils.loadJs(wrapModule(module))
    })

    const {
        log, info, warn, error,
    } = utils.exlgLog(
        `module/${module.id}@${module.metadata.version}`,
    )
    let exports: ModuleExports | null = null
    const inject = async <T>(moduleId: string): Promise<T | undefined> => {
        const mod = exlg.modules[moduleId]
        if (!mod) return undefined
        const state = await mod.runtime.executeState
        if (state === ExecuteState.Done) return await mod.runtime.exports as T
    }

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
            inject,
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

    if (exports.style) {
        utils.loadCss(exports.style)
        log('Style loaded.')
    }

    try {
        await exports.entry?.()
    }
    catch (err) {
        if (err instanceof utils.MatchError) return ExecuteState.Mismatched
        error('Failed to execute: %o', err)
        return ExecuteState.Threw
    }
    log('Executed.')

    return ExecuteState.Done
}

export const checkDependencies = (dep?: ModuleDependencies): [ boolean, string[] ] => {
    if (!dep) return [true, []]
    let ok = true
    const missingDepNames = []
    for (const [depName, depVersion] of Object.entries(dep)) {
        const depInfo = `${depName}:${depVersion}`
        if (!depVersion) continue
        if (depName === 'core') {
            if (!utils.semver.satisfies(exlg.coreVersion, depVersion)) {
                ok = false
                missingDepNames.push(depInfo)
            }
        }
        else {
            const depModule = exlg.modules[depName]
            if (!depModule
                || !utils.semver.satisfies(depModule.metadata.version, depVersion)
            ) {
                ok = false
                missingDepNames.push(depInfo)
            }
        }
    }
    return [ok, missingDepNames]
}

export interface ModuleControl {
    modulesStorage: Storage<ModulesReadonly>
    moduleStorages: Record<string, Storage>
    installModule: typeof installModule
    InstallStates: typeof InstallState
    executeModule: typeof executeModule
    ExecuteStates: typeof ExecuteState
    checkDependencies: typeof checkDependencies
}

export type ModuleInjector =
    <S extends keyof ModuleInjection>(moduleId: S) => Promise<ModuleInjection[S] | undefined>
