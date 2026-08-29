export type Cleanup = () => void | Promise<void>

/** Owns resources and disposes them together. */
export interface Scope {
  readonly signal: AbortSignal
  readonly disposed: boolean
  add(cleanup: Cleanup): Cleanup
  child(): Scope
  dispose(): Promise<void>
}

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type FeatureCapability = 'dom' | 'storage' | 'clipboard'
export type FeatureStatus = 'disabled' | 'idle' | 'mounting' | 'mounted' | 'error'
export type RouteKind =
  | 'home'
  | 'problem'
  | 'record'
  | 'discussion'
  | 'user'
  | 'contest'
  | 'training'
  | 'blog'
  | 'unknown'

export interface RouteSnapshot {
  readonly key: string
  readonly kind: RouteKind
  readonly url: URL
  readonly params: Readonly<Record<string, string>>
}

export interface RouteSource {
  current(): RouteSnapshot
  subscribe(listener: (route: RouteSnapshot) => void): Cleanup
}

interface SettingBase<T, Kind extends string> {
  readonly kind: Kind
  readonly title: string
  readonly description?: string
  readonly default: T
}

export type BooleanSetting = SettingBase<boolean, 'boolean'>
export type StringSetting = SettingBase<string, 'string'>
export interface SelectSetting<Value extends string = string>
  extends SettingBase<Value, 'select'> {
  readonly options: readonly { readonly value: Value; readonly label: string }[]
}

export type SettingDefinition = BooleanSetting | StringSetting | SelectSetting
export type SettingsSchema = Readonly<Record<string, SettingDefinition>>
export type SettingsValues<Schema extends SettingsSchema> = {
  -readonly [Key in keyof Schema]: Schema[Key] extends SettingBase<infer Value, string>
    ? Value
    : never
}

export const setting = {
  boolean(definition: Omit<BooleanSetting, 'kind'>): BooleanSetting {
    return { kind: 'boolean', ...definition }
  },
  string(definition: Omit<StringSetting, 'kind'>): StringSetting {
    return { kind: 'string', ...definition }
  },
  select<const Value extends string>(
    definition: Omit<SelectSetting<Value>, 'kind'>,
  ): SelectSetting<Value> {
    return { kind: 'select', ...definition }
  },
}

/** Typed access to one feature's settings namespace. */
export interface FeatureSettings<Values extends object> {
  get<Key extends keyof Values>(key: Key): Promise<Values[Key]>
  getAll(): Promise<Values>
  set<Key extends keyof Values>(key: Key, value: Values[Key]): Promise<void>
}

/** JSON-only access to one feature's private data namespace. */
export interface FeatureStorage {
  get<T extends JsonValue>(key: string, fallback?: T): Promise<T | undefined>
  set<T extends JsonValue>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  update<T extends JsonValue>(
    key: string,
    updater: (current: T | undefined) => T,
    fallback?: T,
  ): Promise<T>
}

export interface DomCreateOptions {
  readonly className?: string
  readonly text?: string
  readonly attributes?: Readonly<Record<string, string>>
}

export interface DomObserveOptions {
  readonly root?: ParentNode
  readonly attributes?: boolean
}

/** DOM operations whose side effects are automatically bound to a Scope. */
export interface ScopedDomService {
  query<ElementType extends Element = HTMLElement>(
    selector: string,
    root?: ParentNode,
  ): ElementType | null
  queryAll<ElementType extends Element = HTMLElement>(
    selector: string,
    root?: ParentNode,
  ): readonly ElementType[]
  create<Tag extends keyof HTMLElementTagNameMap>(
    tag: Tag,
    options?: DomCreateOptions,
  ): HTMLElementTagNameMap[Tag]
  mount(parent: ParentNode | string, node: Node, position?: 'append' | 'prepend'): void
  listen(
    target: EventTarget,
    event: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  style(css: string): HTMLStyleElement
  observe<ElementType extends Element = HTMLElement>(
    selector: string,
    callback: (element: ElementType) => void,
    options?: DomObserveOptions,
  ): void
}

export interface ClipboardService {
  writeText(text: string): Promise<void>
}

export interface FeatureLogger {
  debug(message: string, ...details: readonly unknown[]): void
  info(message: string, ...details: readonly unknown[]): void
  warn(message: string, ...details: readonly unknown[]): void
  error(message: string, ...details: readonly unknown[]): void
}

export interface FeatureContext<Values extends object> {
  readonly scope: Scope
  readonly signal: AbortSignal
  readonly settings: FeatureSettings<Values>
  readonly storage: FeatureStorage
  readonly dom: ScopedDomService
  readonly clipboard: ClipboardService
  readonly log: FeatureLogger
}

export interface MountContext<Values extends object> extends FeatureContext<Values> {
  readonly route: RouteSnapshot
}

export interface FeatureDefinition<Schema extends SettingsSchema = SettingsSchema> {
  readonly id: string
  readonly apiVersion: 1
  readonly title: string
  readonly description: string
  readonly category: string
  readonly defaultEnabled: boolean
  readonly matches: (route: RouteSnapshot) => boolean
  readonly capabilities: readonly FeatureCapability[]
  readonly settings: Schema
  readonly activate?: (
    context: FeatureContext<SettingsValues<Schema>>,
  ) => void | Cleanup | Promise<void | Cleanup>
  readonly mount?: (
    context: MountContext<SettingsValues<Schema>>,
  ) => void | Cleanup | Promise<void | Cleanup>
}

export type AnyFeatureDefinition = FeatureDefinition<SettingsSchema>

/** Preserves the value types described by a feature's settings schema. */
export function defineFeature<const Schema extends SettingsSchema>(
  definition: FeatureDefinition<Schema>,
): FeatureDefinition<Schema> {
  return definition
}

export interface FeatureStatusSnapshot {
  readonly id: string
  readonly status: FeatureStatus
  readonly lastError?: string
  readonly routeKey?: string
}

export interface KernelController {
  start(): Promise<void>
  stop(): Promise<void>
  setFeatureEnabled(id: string, enabled: boolean): Promise<void>
  remountFeature(id: string): Promise<void>
  retryFeature(id: string): Promise<void>
  getFeatureStatus(id: string): FeatureStatusSnapshot
  subscribeFeatureStatus(listener: (status: FeatureStatusSnapshot) => void): Cleanup
}
