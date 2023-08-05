import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWindows = defineStore('window', () => {
    const activeWindowType = ref<'config' | 'interface' | null>(null)
    const activeWindowId = ref<string | null>(null)

    const showConfigWindow = (id: string) => {
        activeWindowType.value = 'config'
        activeWindowId.value = id
    }

    const showInterfaceWindow = (id: string) => {
        activeWindowType.value = 'interface'
        activeWindowId.value = id
    }

    const closeWindow = () => {
        activeWindowType.value = null
        activeWindowId.value = null
    }

    return {
        activeWindowId, activeWindowType,
        showConfigWindow, showInterfaceWindow, closeWindow
    }
})
