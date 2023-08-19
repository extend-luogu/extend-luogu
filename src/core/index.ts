import { utils, type Utils } from './utils/packed'

import {
    defineStorage, Schema, type Schemas, type Storage,
} from './storage'
import {
    initModulesStorage,
    moduleStorages,
    installModule,
    InstallState,
    executeModule,
    ExecuteState,
    isDependenciesOk,
    type Module,
    type Modules,
    type ModuleReadonly,
    type ModulesReadonly,
    type ModuleControl,
} from './module'
import pack from './package.json'

export interface Exlg {
    coreVersion: string
    utils: Utils
    modules: Modules
    moduleControl?: ModuleControl
    defineStorage: typeof defineStorage
    schemas: Schemas
}

export {
    Schema, Schemas, Module, Modules, ModuleReadonly, ModulesReadonly,
}

declare global {
    interface Window {
        $: JQueryStatic
        exlg: Exlg
        exlgResources: Record<string, string>
    }
}

const launch = async () => {
    const logger = utils.exlgLog('core')

    logger.log('Launching... (exposed to window.exlg)')

    unsafeWindow.exlg = {
        coreVersion: pack.version,
        utils,
        modules: {},
        schemas: {},
        defineStorage,
    }

    logger.log('Loading modules from storage.')

    const modulesStorage = defineStorage(
        'modules',
        Schema.dict(
            Schema.object({
                id: Schema.string(),
                active: Schema.boolean(),
                script: Schema.string(),
                metadata: Schema.object({
                    name: Schema.string(),
                    source: Schema.string(),
                    version: Schema.string(),
                    description: Schema.string(),
                    display: Schema.string(),
                    dependencies: Schema.dict(Schema.string()),
                }),
            }),
        ),
    ) as Storage<ModulesReadonly>
    initModulesStorage(modulesStorage)

    unsafeWindow.exlg.moduleControl = {
        moduleStorages,
        modulesStorage,
        installModule,
        InstallStates: InstallState,
        executeModule,
        ExecuteStates: ExecuteState,
        isDependenciesOk,
    }

    const modules = modulesStorage.getAll()

    unsafeWindow.exlg.modules = {}
    for (const id in modules) {
        unsafeWindow.exlg.modules[id] = Object.freeze({
            ...modules[id],
            runtime: { interfaces: {} },
        })
    }

    logger.log('Executing modules.')

    const executeStates = []

    for (const module of Object.values(exlg.modules)) {
        Object.freeze(module)
        executeStates.push(
            module.runtime.executeState = executeModule(module),
        )
    }

    logger.log('Loading dash')

    const dashRoot = unsafeWindow.document.createElement('div')
    dashRoot.id = 'exlg-dash'
    unsafeWindow.document.body.appendChild(dashRoot)

    utils.loadCss(unsafeWindow.exlgResources.dashCss)
    utils.loadJs(unsafeWindow.exlgResources.dashJs)

    await Promise.all(executeStates)

    logger.log('Launched.')
}

launch()
