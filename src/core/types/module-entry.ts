import { Exlg } from '..'
import type { ModuleExports, ModuleRuntime } from '../module'
import type { Logger } from '../utils/utils'

export * from '.'

declare global {
    const define: (e: ModuleExports) => void
    const runtime: ModuleRuntime
    const log: Logger
    const info: Logger
    const warn: Logger
    const error: Logger
    const exlg: Exlg
}
