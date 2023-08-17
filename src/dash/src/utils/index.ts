import type { ModuleDependencies } from '@core/module'

export enum InstallState {
    uninstalled,
    installed,
    installing,
    installFailed
}

export type SourceVersion = {
    version: string
    dependencies: ModuleDependencies
}

export interface SourceItem {
    id: string
    name: string
    description: string
    versions: SourceVersion[]
    selectedVersion: SourceVersion
    display: string
    bin: string
}
export interface NpmSourceItem extends SourceItem {
    type: 'npm'
    package: string
}
export type AllSourceItem = NpmSourceItem
export type Source = AllSourceItem[]
