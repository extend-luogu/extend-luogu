import { Exlg } from '..'

export type {
    Module,
    ModuleCtl,
    ModuleExports,
    ModuleMetadata,
    ModuleRuntime,
    ModuleWrapper,
    Modules
} from '../module'

export type { Utils } from '../utils'

export type { Storage, Schema, Schemas } from '../storage'

export type { Exlg } from '..'

declare global {
    interface Window {
        exlg: Exlg
    }
}
