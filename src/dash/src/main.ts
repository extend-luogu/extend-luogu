import * as Vue from 'vue'
import { createApp } from 'vue'
import type { Exlg } from '../../core'
import App from './App.vue'

declare global {
    interface Window {
        exlg: Exlg
        exlgVue: typeof Vue
    }
}

window.exlgVue = Vue
createApp(App).mount('#exlg-dash')
