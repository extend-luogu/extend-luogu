import { InjectionKey } from 'vue'
import type { ModuleCtl } from '@core/types'

export const kModuleCtl = Symbol('ModuleCtl') as InjectionKey<ModuleCtl>
export const kShowConfig = Symbol('ShowConfig') as InjectionKey<
    (configId: string) => void
>
export const kShowInterface = Symbol('ShowInterface') as InjectionKey<
    (modId: string) => void
>
