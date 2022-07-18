import * as Vue from 'vue'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@core/types'
import App from './App.vue'

window.exlgDash = {
    Vue
}

export const logger = window.exlg.utils.exlgLog('dash')

createApp(App).use(createPinia()).mount('#exlg-dash')
logger.log('Mounted to #exlg-dash...')
