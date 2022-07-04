import type { Exlg, Schema } from '..'
import type { ModuleExports, ModuleRuntime } from '../module'
import type { Utils } from '../utils'
import type { LoggerFunction } from '../utils/utils'

export * from '.'

declare global {
    const define: (e: ModuleExports) => void
    const runtime: ModuleRuntime<any>
    const Schema: Schema.Static
    const utils: Utils
    const log: LoggerFunction
    const info: LoggerFunction
    const warn: LoggerFunction
    const error: LoggerFunction
    const exlg: Exlg
}
