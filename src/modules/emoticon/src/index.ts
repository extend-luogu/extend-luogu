import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'
import { emos, size, Emo } from './assets'

utils.mustMatch([/^\/discuss\/\d+/, /^\/discuss\/lists\?forumname=/], {
    withSearch: true,
})

const sto = runtime.storage as SchemaToStorage<typeof Scm>

const emoUrl = (emo: Emo) => {
    const file = emo.file + (emo.type === 'txt' ? size : '')
    return `${sto.get('emoSource')}/${file}`
}

const $menu = $('.mp-editor-menu')
const $txt = $('.CodeMirror-wrap textarea')