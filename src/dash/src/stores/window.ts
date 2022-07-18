import { defineStore } from 'pinia'

export default defineStore('window', {
    state: () => ({
        windows: [] as string[]
    }),
    actions: {
        focus(window: string) {
            this.windows.push(window)
        },
        blur() {
            this.windows.pop()
        }
    },
    getters: {
        active(): string {
            return this.windows.at(-1)!
        }
    }
})
