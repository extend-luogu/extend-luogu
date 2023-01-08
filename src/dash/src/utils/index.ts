import { ref, UnwrapRef } from 'vue'

export enum InstallState {
    uninstalled,
    installed,
    installing,
    installFailed
}

export interface SourceItem {
    id: string
    name: string
    description: string
    versions: string[]
    selectedVersion: string
    display: string
    bin: string
}
export interface NpmSourceItem extends SourceItem {
    type: 'npm'
    package: string
}
export type AllSourceItem = NpmSourceItem
export type Source = AllSourceItem[]

export function useAsyncState<T>(promise: Promise<T>, initialState?: T) {
    const state = ref(initialState)
    const isReady = ref(false)
    const isLoading = ref(false)
    const error = ref<unknown>(undefined)

    async function execute() {
        error.value = undefined
        isReady.value = false
        isLoading.value = true

        try {
            const data = await promise
            state.value = data as UnwrapRef<T>
            isReady.value = true
        } catch (e) {
            error.value = e
        }

        isLoading.value = false
    }

    execute()

    return {
        state,
        isReady,
        isLoading,
        error
    }
}
