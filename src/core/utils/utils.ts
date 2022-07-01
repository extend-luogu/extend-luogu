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

export type LoggerFunction = (fmtString: string, ...params: unknown[]) => void

export const exlgLog = (subject: string): Record<string, LoggerFunction> =>
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
    )
