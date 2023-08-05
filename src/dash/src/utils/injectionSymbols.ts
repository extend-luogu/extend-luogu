import { InjectionKey } from 'vue'
import type { ModuleControl } from '@core/types'

export const kModuleControl = Symbol('ModuleControl') as InjectionKey<ModuleControl>
export const kShowConfig = Symbol('ShowConfig') as InjectionKey<
    (configId: string) => void
>
export const kShowInterface = Symbol('ShowInterface') as InjectionKey<
    (modId: string) => void
>
