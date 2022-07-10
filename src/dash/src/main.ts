import * as Vue from 'vue'
import { createApp } from 'vue'
import '../../core/types'
import App from './App.vue'

window.exlgDash = {
    Vue
}

export const logger = window.exlg.utils.exlgLog('dash')

createApp(App).mount('#exlg-dash')
logger.log('Mounted to #exlg-dash...')
