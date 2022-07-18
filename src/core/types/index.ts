import { Exlg } from '..'
import { ExlgDash } from './dash'

export type { VueType, VueAll } from './dash'

export type {
    Module,
    ModuleCtl,
    ModuleExports,
    ModuleMetadata,
    ModuleRuntime,
    ModuleWrapper,
    Modules,
    ModuleReadonly,
    ModulesReadonly,
    ModuleInterface,
    ModuleInterfaces,
    ExecuteState
} from '../module'

export type { Utils } from '../utils'

export type {
    Storage,
    Schema,
    Schemas,
    SchemaToStorage,
    SchemaToType
} from '../storage'

export type { Exlg } from '..'

declare global {
    interface Window {
        exlg: Exlg
        exlgDash: ExlgDash
    }
}
