import { type Schema } from '@core/types'
const { Schema: Scm } = window.exlg.utils

export const npmSources = [
    { url: 'https://unpkg.com', name: 'unpkg' },
    { url: 'https://cdn.jsdelivr.net/npm', name: 'jsdelivr' },
    { url: 'https://fastly.jsdelivr.net/npm', name: 'jsdelivr (fastly)' }
] as const

export const githubSources = [
    { url: 'https://raw.githubusercontent.com/extend-luogu/exlg-module-registry/dist/index.json', name: 'github raw' },
] as const


const sourceSchema = <
    T extends readonly { readonly url: string; readonly name: string }[],
    K extends keyof T & number
>(
    sources: T
): Schema<T[K]['url']> =>
    Scm.union(
        sources.map(({ url, name }) => Scm.const(url).description(name))
    ).default(sources[0].url)

export const marketStorage = window.exlg.defineStorage(
    'market',
    Scm.object({
        npmSource: sourceSchema(npmSources).description('NPM 源'),
        githubSource: sourceSchema(githubSources).description('github 源')
    })
)
