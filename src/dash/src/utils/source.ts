import { type Schema } from '@core/types'
const { Schema: Scm } = window.exlg.utils

export const npmSources = [
    { url: 'https://unpkg.com', name: 'unpkg' },
    { url: 'https://cdn.jsdelivr.net/npm', name: 'jsdelivr' },
    { url: 'https://fastly.jsdelivr.net/npm', name: 'jsdelivr (fastly)' }
] as const

export const registrySources = [
    { url: 'https://exlg-celeste.oss-cn-shanghai.aliyuncs.com/latest/index.json', name: 'aliyun' },
    { url: 'https://raw.githubusercontent.com/extend-luogu/exlg-module-registry/dist/index.json', name: 'github raw' },
    { url: 'http://localhost:3819/index.json', name: 'local' }
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
        registrySource: sourceSchema(registrySources).description('registry 源')
    })
)
