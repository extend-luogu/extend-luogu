import * as Vue from 'vue'
import { createApp } from 'vue'
import type { Exlg } from '../../core'
import App from './App.vue'

declare global {
    interface Window {
        exlg: Exlg
        exlgDash: {
            Vue: typeof Vue
        }
    }
}

window.exlgDash = {
    Vue
}

export const logger = window.exlg.utils.exlgLog('dash')

createApp(App).mount('#exlg-dash')
logger.log('Mounted to #exlg-dash...')
