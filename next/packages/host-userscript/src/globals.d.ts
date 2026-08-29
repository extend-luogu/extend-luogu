declare function GM_getValue<T>(key: string, defaultValue?: T): T
declare function GM_setValue(key: string, value: unknown): void
declare function GM_deleteValue(key: string): void
declare function GM_setClipboard(text: string, info?: string): void
declare const unsafeWindow: Window
