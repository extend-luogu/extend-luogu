declare function GM_getValue<T>(key: string, defaultValue?: T): T
declare function GM_setValue(key: string, value: unknown): void
declare function GM_deleteValue(key: string): void
declare function GM_setClipboard(text: string, info?: string): void
interface GMXmlHttpRequestResponse {
  readonly status: number
  readonly responseText: string
  readonly finalUrl?: string
}
interface GMXmlHttpRequestHandle { abort(): void }
declare function GM_xmlhttpRequest(options: {
  readonly url: string
  readonly method: 'GET' | 'POST'
  readonly headers?: Readonly<Record<string, string>>
  readonly data?: string
  readonly timeout?: number
  readonly anonymous?: boolean
  readonly responseType?: 'text'
  readonly onload: (response: GMXmlHttpRequestResponse) => void
  readonly onerror: () => void
  readonly onabort: () => void
  readonly ontimeout: () => void
}): GMXmlHttpRequestHandle
declare const unsafeWindow: Window & typeof globalThis
