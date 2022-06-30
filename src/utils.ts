declare global {
    // TamperMonkey

    function GM_addElement(tagName: string, attributes: object): void

    // Luogu

    const _feInjection: object
}

export const evalScript = (script: string) => {
    GM_addElement('script', { textContent: script })
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

export type LoggerFunction = (fmtString: string, ...params: unknown[]) => void

export const exlgLog = (subject: string): Record<string, LoggerFunction> =>
    Object.fromEntries(
        (['log', 'info', 'warn', 'error'] as const).map((level) => [
            level,
            (fmtString: string, ...params: unknown[]) =>
                // eslint-disable-next-line no-console
                console[level](
                    `%s[exlg: ${subject}] ${fmtString}`,
                    'color: #0e90d2;',
                    ...params
                )
        ])
    )
