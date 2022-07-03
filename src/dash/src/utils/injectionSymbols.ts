import { InjectionKey } from 'vue'
import { ModuleCtl } from '../../../core/module'

export const kModuleCtl = Symbol('ModuleCtl') as InjectionKey<ModuleCtl>
