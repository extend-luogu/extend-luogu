/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: 利用 Schema 标注类型

type SchemaPrimitive = typeof String | typeof Number | typeof Boolean
type SchemaType = SchemaPrimitive | [SchemaPrimitive]
interface SchemaItem {
    type: SchemaType
    desc: string
}
export type Schema = Record<string, SchemaItem>
export type Schemas = Record<string, Schema>

export interface Storage {
    from: (targetNamespace: string) => Storage | null
    get: (key: string) => any
    getAll: () => Record<string, any>
    set: (key: string, value: any) => void
    inc: (key: string) => void
    push: (key: string, ...values: any[]) => void
    do: (key: string, fn: (value: any) => any) => void
}

const storage = (
    namespace: string,
    schema: Schema,
    direct: boolean
): Storage => {
    const checkPrivate = (key: string) => {
        if (key[0] === '_' && !direct)
            throw Error('Cannot access private storage of other modules.')
    }
    return {
        from: (newNamespace: string): Storage | null => {
            const newSchema = unsafeWindow.exlg.schemas[newNamespace]
            if (!newSchema) return null
            return storage(newNamespace, newSchema, false)
        },
        get: (key: string): any => {
            checkPrivate(key)
            const data = GM_getValue(namespace) as any
            return data[key]
        },
        getAll: (): Record<string, any> => {
            const data = GM_getValue(namespace) as any
            if (!direct) {
                for (const key in data) if (key[0] === '_') delete data[key]
            }
            return data
        },
        set: (key: string, value: any) => {
            checkPrivate(key)
            const data = GM_getValue(namespace) as any
            data[key] = value
            GM_setValue(namespace, data)
        },
        inc: (key: string) => {
            checkPrivate(key)
            const data = GM_getValue(namespace) as any
            data[key]++
            GM_setValue(namespace, data)
        },
        push: (key: string, ...values: any[]) => {
            checkPrivate(key)
            const data = GM_getValue(namespace) as any
            data[key].push(...values)
            GM_setValue(namespace, data)
        },
        do: (key: string, fn: (value: any) => any) => {
            checkPrivate(key)
            const data = GM_getValue(namespace) as any
            data[key] = fn(data[key])
            GM_setValue(namespace, data)
        }
    }
}

export const defineStorage = (namespace: string, schema: Schema): Storage => {
    unsafeWindow.exlg.schemas[namespace] = schema
    return storage(namespace, schema, true)
}
