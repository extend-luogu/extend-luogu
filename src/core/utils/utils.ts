import './index.css'
import './SimpleAlert.css'

import $ from 'jquery'
import { is } from 'schemastery'
import { Schema } from '../storage'
import type { ExecuteState } from '../module'

declare global {
    // TamperMonkey

    function GM_addElement(tagName: string, attributes: object): void

    // Luogu

    const _feInjection: any
    const _feInstance: any
    const markdownPalettes: {
        content?: string
    } | void
}

export { Schema }

unsafeWindow.$ ??= $

function addElement(tagName: string, attributes: object): void {
    if (typeof GM_addElement === 'function') {
        GM_addElement(tagName, attributes)
    } else {
        const e = document.createElement(tagName)
        document.head.appendChild(Object.assign(e, attributes))
    }
}

export const loadJs = (js: string) => {
    addElement('script', { textContent: js })
}

export const loadCss = (css: string) => {
    addElement('style', { textContent: css })
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
            if (prop === 'catch') {
                return (cb: (r: T) => T | Promise<T>) => {
                    target.catch(cb)
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

export const match = (
    patterns: MaybeArray<RegExp | string>,
    options: {
        withSearch?: boolean
    } = {}
) => {
    const { location } = unsafeWindow
    let now = location.pathname
    if (options.withSearch) now += location.search
    return wrapArray(patterns).some((pattern) => now.match(pattern))
}

export const mustMatch = (...args: Parameters<typeof match>) => {
    if (!match(...args)) throw new MatchError()
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

export const csGet = (url: string, headers = {}): any => {
    const res = new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            url,
            method: 'GET',
            headers,
            onload: (r: any) => {
                try {
                    r.data = JSON.parse(r.responseText)
                } catch (e) {} // eslint-disable-line no-empty
                resolve(r)
            },
            onerror: reject
        })
    })
    return chain(res)
}

export const sleep = (t: number): Promise<void> =>
    new Promise((res) => {
        setTimeout(res, t)
    })

export interface SimpleAlertCallback {
    (args: {
        event: MouseEvent
        $content: HTMLDivElement
        abort: () => void
    }): void
}

export interface SimpleAlertOptions {
    title?: string
    noAccept?: boolean
    noCancel?: boolean
    onAccept?: SimpleAlertCallback
    onCancel?: SimpleAlertCallback
    onOpen?: ($content: HTMLDivElement) => void
}

export const simpleAlert = (html: string, options: SimpleAlertOptions = {}) => {
    const q = (selectors: string) => document.querySelector(selectors)

    let $root = q('.simple-alert') as HTMLDivElement
    if (!$root) {
        $root = document.createElement('div')
        $root.className = 'simple-alert'
        $root.innerHTML = `
            <p class='title'></p>
            <div class='content'></div>
            <button class='accept exlg-button'>确定</button>
            <button class='cancel exlg-button'>取消</button>
        `
        document.body.appendChild($root)
    } else $root.style.display = 'block'

    let $mask = q('.simple-alert-mask') as HTMLDivElement
    if (!$mask) {
        $mask = document.createElement('div')
        $mask.className = 'simple-alert-mask'
        document.body.appendChild($mask)
    } else $mask.style.display = 'block'

    const $content = $root.querySelector('.content') as HTMLDivElement
    $content.innerHTML = html

    options.onOpen?.($content)

    const $title = $root.querySelector('.title')!
    $title.innerHTML = options.title ?? 'exlg 提醒您'

    const $accept = $root.querySelector('.accept') as HTMLButtonElement
    const $cancel = $root.querySelector('.cancel') as HTMLButtonElement

    $accept.style.display = options.noAccept ? 'none' : ''
    $cancel.style.display = options.noCancel ? 'none' : ''

    const handleButton = (
        $el: HTMLButtonElement,
        listener: 'onAccept' | 'onCancel'
    ) => {
        const handler = (event: MouseEvent) => {
            let aborted = false
            const abort = () => {
                aborted = true
            }
            options[listener]?.({ event, abort, $content })

            if (!aborted) {
                $el.removeEventListener('click', handler)
                $root.style.display = 'none'
                $mask.style.display = 'none'
            }
        }
        $el.addEventListener('click', handler)
    }

    handleButton($accept, 'onAccept')
    handleButton($cancel, 'onCancel')
}

export interface HookModElementOption {
    onLoad: (selector: string) => void
    onError?: (state: Omit<ExecuteState, 'done'> | undefined) => void
}

export const hookModElement = async (
    mod: string,
    selector: string,
    { onLoad, onError }: HookModElementOption
) => {
    const statePromise = unsafeWindow.exlg.modules[mod].runtime.executeState
    if (!statePromise) {
        onError?.(undefined)
        return
    }

    const cloakStyle: HTMLStyleElement | void = GM_addStyle(
        `${selector} { display: none; }`
    )

    const state = await unsafeWindow.exlg.modules[mod].runtime.executeState
    if (state === 'done') onLoad(selector)
    else onError?.(state)

    cloakStyle!.remove()
}

type NodeListLike = Node[] | NodeList
type hookType = (insertedNodes: NodeListLike) => Node[]
type callbackType = (hookedNodes: NodeListLike) => void
type hookCallbackType = (insertedNodes: NodeListLike) => void

const hookList: hookCallbackType[] = []
const hooker = new MutationObserver((records) => {
    const tmpNodeList: NodeListLike = []
    records.forEach((record) => {
        record.addedNodes.forEach((addedNode) => tmpNodeList.push(addedNode))
    })
    hookList.forEach((hook) => hook(tmpNodeList))
})

export function addHook(hook: hookCallbackType) {
    hookList.push(hook)
}

export function addHookAndCallback(hook: hookType, callback: callbackType) {
    addHook((insertedNodes) => {
        const hookedNodes = hook(insertedNodes)
        if (hookedNodes.length) callback(hookedNodes)
    })
}

export function addHookSelector(selector: string, callback: callbackType) {
    addHookAndCallback((insertedNodes) => {
        const hookedNodes: NodeListLike = []
        insertedNodes.forEach((node) => {
            if ($(node).is(selector)) hookedNodes.push(node)
            hookedNodes.push(...$(node).find(selector).get())
        })
        return hookedNodes
    }, callback)
}

hooker.observe(document.body, { childList: true, subtree: true })
