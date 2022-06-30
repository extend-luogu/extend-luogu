import utils, { Utils } from './utils'
import type { Schema, Schemas } from './storage'
import { Module, Modules, launch } from './core'

export interface Exlg {
    utils: Utils
    modules: Modules
    schemas: Schemas
}

export { Schema, Schemas, Module, Modules }

declare global {
    interface Window {
        exlg: Exlg
    }
}
unsafeWindow.exlg = {
    utils,
    modules: {},
    schemas: {}
}

launch()
