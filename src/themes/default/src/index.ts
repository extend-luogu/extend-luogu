import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'

const sto = runtime.storage as SchemaToStorage<typeof Scm>

const root = document.querySelector(':root') as HTMLElement
root.style.setProperty('--accent-color', sto.get('accentColor'))
