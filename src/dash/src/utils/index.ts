export enum InstallState {
    uninstalled,
    installed,
    installing,
    installFailed
}

export interface SourceItem {
    id: string
    name: string
    description: string
    versions: string[]
    selectedVersion: string
    display: string
    bin: string
}
export interface NpmSourceItem extends SourceItem {
    type: 'npm'
    package: string
}
export type AllSourceItem = NpmSourceItem
export type Source = AllSourceItem[]
