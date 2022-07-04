import utils, { Utils } from './utils'
import type { Schema, Schemas } from './storage'
import {
    Module,
    Modules,
    ModuleReadonly,
    ModulesReadonly,
    ModuleCtl,
    launch
} from './module'

export interface Exlg {
    utils: Utils
    modules: Modules
    moduleCtl?: ModuleCtl
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
    utils,
    modules: {},
    schemas: {},
    dash: {}
}

launch()
