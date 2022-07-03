declare global {
    // TamperMonkey

    function GM_addElement(tagName: string, attributes: object): void

    // Luogu

    const _feInjection: object
}

export const loadJs = (js: string) => {
    GM_addElement('script', { textContent: js })
}

export const loadCss = (css: string) => {
    GM_addElement('style', { textContent: css })
}

export function chain<T>(res: Promise<T>): Promise<T> {
    return new Proxy(res, {
        get(target, prop) {
            if (prop === 'then') {
                return (cb: (r: T) => T | Promise<T>) => {
                    target.then(cb)
                    return chain(target)
                }
            }
            return chain(target.then((r) => r[prop as keyof T]))
        }
    })
}

export type LoggerNames = 'log' | 'info' | 'warn' | 'error'
export type LoggerFunction = (fmtString: string, ...params: unknown[]) => void
export type Logger = Record<LoggerNames, LoggerFunction>

export const exlgLog = (subject: string): Logger =>
    Object.fromEntries(
        (['log', 'info', 'warn', 'error'] as const).map((level) => [
            level,
            (fmtString: string, ...params: unknown[]) =>
                // eslint-disable-next-line no-console
                console[level](
                    `%c[exlg: ${subject}]%c ${fmtString}`,
                    'color: #0e90d2;',
                    '',
                    ...params
                )
        ])
    ) as Logger

export type MaybeArray<T> = T | T[]

export const wrapArray = <T>(value: MaybeArray<T>): T[] =>
    Array.isArray(value) ? value : [value]

export class MatchError extends Error {}

export const match = (paths: MaybeArray<RegExp | string>) =>
    wrapArray(paths).some((path) => unsafeWindow.location.pathname.match(path))

export const mustMatch = (paths: MaybeArray<RegExp | string>) => {
    if (!match(paths)) throw new MatchError()
}

export const csPost = (
    url: string,
    data: any,
    header = {},
    type = 'application/json'
): any => {
    const res = new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            url,
            method: 'POST',
            data: typeof data !== 'string' ? JSON.stringify(data) : data,
            headers: {
                'Content-Type':
                    typeof data === 'string' ? type : 'application/json',
                ...header
            },
            onload: (r: any) => {
                try {
                    r.data = JSON.parse(r.responseText)
                } catch {} // eslint-disable-line no-empty
                resolve(r)
            },
            onerror: reject
        })
    })
    return chain(res)
}
