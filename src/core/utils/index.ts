import './index.css'
import './SimpleAlert.css'

import $ from 'jquery'
import { marked } from 'marked'
import { FilterXSS } from 'xss'
import { Schema } from '../storage'
import type { ExecuteState } from '../module'

interface FeInjectionType {
    code: number
    currentData: any
    currentTemplate: string
    currentTheme: any
    currentUser: any
}

declare global {
    // TamperMonkey

    function GM_addElement(tagName: string, attributes: object): void

    // Luogu

    const _feInjection: FeInjectionType
    const _feInstance: any
    const markdownPalettes: {
        content?: string
    } | void
}

export { Schema }

unsafeWindow.$ ??= $

const addElement = typeof GM_addElement === 'function'
    ? (tagName: string, attributes: object) => GM_addElement(tagName, attributes)
    : (tagName: string, attributes: object) => {
        const e = document.createElement(tagName)
        document.head.appendChild(Object.assign(e, attributes))
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
        },
    })
}

export type LoggerNames = 'log' | 'info' | 'warn' | 'error'
export type LoggerFunction = (fmtString: string, ...params: unknown[]) => void
export type Logger = Record<LoggerNames, LoggerFunction>

export const exlgLog = (subject: string): Logger => Object.fromEntries(
    (['log', 'info', 'warn', 'error'] as const).map((level) => [
        level,
        // eslint-disable-next-line no-console
        (fmtString: string, ...params: unknown[]) => console[level](
            `%c[exlg: ${subject}]%c ${fmtString}`,
            'color: #0e90d2;',
            '',
            ...params,
        ),
    ]),
) as Logger

export type MaybeArray<T> = T | T[]

export const wrapArray = <T>(value: MaybeArray<T>): T[] => (Array.isArray(value) ? value : [value])

export class MatchError extends Error {}

export const match = (
    patterns: MaybeArray<RegExp | string>,
    options: {
        withSearch?: boolean
    } = {},
) => {
    const { location } = unsafeWindow
    let now = location.pathname
    if (options.withSearch) now += location.search
    return wrapArray(patterns).some((pattern) => now.match(pattern))
}

export const mustMatch = (...args: Parameters<typeof match>) => {
    if (!match(...args)) throw new MatchError()
}

interface Response<T = any> extends Tampermonkey.ResponseBase {
    get json(): T
}

const request = <T = any>(options: {
    url: string
    method: 'GET' | 'POST'
    headers: Record<string, string>
    data?: string
}) => chain(new Promise<Response<T>>((resolve, reject) => {
    GM_xmlhttpRequest({
        ...options,
        onload: (r) => {
            const response = {
                ...r,
                response: r.response,
                responseText: r.responseText,
                responseXML: r.responseXML,
                get json(): T {
                    try {
                        return JSON.parse(response.response)
                    }
                    catch (e) {
                        throw new Error(
                            `JSON 解析错误！ ${(e as Error).message}`,
                        )
                    }
                },
            }
            resolve(response)
        },
        onerror: reject,
    })
}))

export const csPost = <T = any>(
    url: string,
    data: string | object,
    header = {},
    type = 'application/json',
) => request<T>({
    url,
    method: 'POST',
    data: typeof data !== 'string' ? JSON.stringify(data) : data,
    headers: {
        'Content-Type': typeof data === 'string' ? type : 'application/json',
        ...header,
    },
})

export const csGet = <T = any>(url: string, headers = {}) => request<T>({
    url,
    method: 'GET',
    headers,
})

export const sleep = (t: number): Promise<void> => new Promise((res) => {
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
    }
    else $root.style.display = 'block'

    let $mask = q('.simple-alert-mask') as HTMLDivElement
    if (!$mask) {
        $mask = document.createElement('div')
        $mask.className = 'simple-alert-mask'
        document.body.appendChild($mask)
    }
    else $mask.style.display = 'block'

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
        listener: 'onAccept' | 'onCancel',
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
    { onLoad, onError }: HookModElementOption,
) => {
    const statePromise = unsafeWindow.exlg.modules[mod].runtime.executeState
    if (!statePromise) {
        onError?.(undefined)
        return
    }

    const cloakStyle: HTMLStyleElement | void = GM_addStyle(
        `${selector} { display: none; }`,
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

export function toInitialCase(s: string) {
    return s[0].toUpperCase() + s.slice(1)
}

export function toKeyCode(e: JQuery.KeyboardEventBase) {
    return [
        e.ctrlKey ? 'Ctrl' : '',
        e.shiftKey ? 'Shift' : '',
        e.altKey ? 'Alt' : '',
        toInitialCase(e.key),
    ].join('')
}

export type LuoguColor =
    | 'Gray'
    | 'Blue'
    | 'Green'
    | 'Orange'
    | 'Red'
    | 'Purple'
    | 'Cheater'

export const color = {
    Gray: 'gray',
    Blue: 'bluelight',
    Green: 'green',
    Orange: 'orange lg-bold',
    Red: 'red lg-bold',
    Purple: 'purple lg-bold',
    Cheater: 'brown lg-bold',
}

export const xss = new FilterXSS({
    whiteList: {},
    onTagAttr: (_, k, v) => {
        if (k === 'style') return `${k}="${v}"`
    },
})

export function renderText(raw: string) {
    return marked(xss.process(raw))
}

export function loadChore(
    lastOperated: number,
    duration: string,
    setLast: (curTime: number) => void,
    callback: () => void | Promise<void>,
): Promise<void> {
    const tm = (
        [
            ['s', 1000],
            ['m', 60],
            ['h', 60],
            ['D', 24],
        ] as [string, number][]
    ).reduce(
        (
            [curUnit, curTime]: [string, number],
            [key, value]: [string, number],
        ) => {
            if (curUnit) curTime *= value
            if (curUnit === key) curUnit = ''
            return [curUnit, curTime]
        },
        [duration.at(-1)!, +duration.slice(0, -1)] as [string, number],
    )[1]

    if (Date.now() - lastOperated > tm) {
        setLast(Date.now())
        return (async () => {
            await callback()
        })()
    }
    return (async () => {})()
}
