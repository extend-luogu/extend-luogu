import utils, { Utils } from './utils'
import { defineStorage } from './storage'
import type { Schema, Schemas } from './storage'
import {
    Module,
    Modules,
    ModuleReadonly,
    ModulesReadonly,
    ModuleCtl,
    launch
} from './module'
import pack from './package.json'

export interface Exlg {
    coreVersion: string
    utils: Utils
    modules: Modules
    moduleCtl?: ModuleCtl
    defineStorage: typeof defineStorage
    schemas: Schemas
    dash: {
        script?: string
    }
}

export { Schema, Schemas, Module, Modules, ModuleReadonly, ModulesReadonly }

declare global {
    interface Window {
        exlg: Exlg
        exlgResources: Record<string, string>
    }
}
unsafeWindow.exlg = {
    coreVersion: pack.version,
    utils,
    defineStorage,
    modules: {},
    schemas: {},
    dash: {}
}

launch()
