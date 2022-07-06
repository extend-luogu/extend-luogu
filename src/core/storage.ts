/* eslint-disable @typescript-eslint/no-explicit-any */

import Schema from 'schemastery'

export { Schema }
export type Schemas = Record<string, Schema>

export interface Storage<T = any> {
    from: <U>(targetNamespace: string) => Storage<U> | null
    get: <K extends keyof T & string>(key: K) => T[K]
    getAll: () => T
    set: <K extends keyof T & string>(key: K, value: T[K]) => void
    del: <K extends keyof T & string>(key: K) => void
    do: <K extends keyof T & string>(key: K, fn: (value: T[K]) => T[K]) => void
    clear: () => void
}

export type FilterKeysWithValueType<O, V> = {
    [K in keyof O]: V extends O[K] ? K : never
}[keyof O]

export type SchemaToType<S> = S extends Schema<infer T> ? T : never
export type SchemaToStorage<S> = S extends Schema<infer T> ? Storage<T> : never

const storage = <T>(
    namespace: string,
    schema: Schema<T>,
    direct: boolean
): Storage<T> => {
    const checkPrivate = (key: keyof T & string) => {
        if (key[0] === '_' && !direct)
            throw Error('Cannot access private property of other storages.')
    }

    const _get = () => schema(GM_getValue(namespace))

    return {
        from: <U>(newNamespace: string): Storage<U> | null => {
            const newSchema = unsafeWindow.exlg.schemas[newNamespace]
            if (!newSchema) return null
            return storage(newNamespace, newSchema, false)
        },
        get: <K extends keyof T & string>(key: K): T[K] => {
            checkPrivate(key)
            const data = _get()
            return data[key]
        },
        getAll: (): T => {
            const data = _get()
            if (!direct) {
                for (const key in data) if (key[0] === '_') delete data[key]
            }
            return data
        },
        set: <K extends keyof T & string>(key: K, value: T[K]) => {
            checkPrivate(key)
            const data = _get()
            data[key] = value
            GM_setValue(namespace, data)
        },
        del: <K extends keyof T & string>(key: K) => {
            checkPrivate(key)
            const data = _get()
            delete data[key]
            GM_setValue(namespace, data)
        },
        do: <K extends keyof T & string>(key: K, fn: (value: T[K]) => T[K]) => {
            checkPrivate(key)
            const data = _get()
            data[key] = fn(data[key])
            GM_setValue(namespace, data)
        },
        clear: () => {
            if (!direct) throw Error('Cannot clear other storages.')
        }
    }
}

export const defineStorage = <T>(
    namespace: string,
    schema: Schema<T>
): Storage<T> => {
    if (unsafeWindow.exlg.schemas[namespace])
        throw Error(`Namespace \`${namespace}\` already exists`)
    unsafeWindow.exlg.schemas[namespace] = schema
    return storage(namespace, schema, true)
}
