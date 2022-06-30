import * as utils from './utils'
import type { Schema, Schemas } from './storage'
import type { Module, Modules } from './core'

export type Utils = typeof utils
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
