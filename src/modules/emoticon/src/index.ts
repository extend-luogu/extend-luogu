import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'

log('hello exlg: Exlg!')
const sto = runtime.storage as SchemaToStorage<typeof Scm>
log('hello %s', sto.get('hello'))
