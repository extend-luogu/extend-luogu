import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ModuleControl, ModulesReadonly, InstallState } from '@core/types'

export const useModules = defineStore('modules', () => {
    const moduleControl = ref(null as unknown as ModuleControl)

    const installStates = reactive<Record<string, InstallState>>({})

    const localModules = ref<ModulesReadonly>()
    const loadLocalModules = () => {
        localModules.value = moduleControl.value.modulesStorage.getAll()
    }

    return {
        moduleControl,
        installStates,
        localModules, loadLocalModules,
    }
})
