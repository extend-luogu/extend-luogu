import type { Exlg, Schema } from '..'
import type { ModuleExports, ModuleInjector, ModuleRuntime } from '../module'
import type { Utils } from '../utils/packed'
import type { LoggerFunction } from '../utils'

export * from '.'

declare global {
    const define: (e: ModuleExports) => void
    const runtime: ModuleRuntime
    const Schema: Schema.Static
    const utils: Utils
    const log: LoggerFunction
    const info: LoggerFunction
    const warn: LoggerFunction
    const error: LoggerFunction
    const exlg: Exlg
    const inject: ModuleInjector
}
