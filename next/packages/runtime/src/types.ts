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
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue }

export type FeatureCapability =
  | 'dom'
  | 'storage'
  | 'clipboard'
  | 'navigation'
  | 'ui'
  | 'network.luogu'
  | 'network.codeforces'
  | 'network.atcoder'
  | 'network.localhost'
  | 'luogu.editor'
  | 'luogu.page-data'
  | 'luogu.private-messages'
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
  | 'chat'
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
export interface NumberSetting extends SettingBase<number, 'number'> {
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly integer?: boolean
}
export interface SelectSetting<Value extends string = string>
  extends SettingBase<Value, 'select'> {
  readonly options: readonly { readonly value: Value; readonly label: string }[]
}
export interface MultiSelectSetting<Value extends string = string>
  extends SettingBase<readonly Value[], 'multiSelect'> {
  readonly options: readonly { readonly value: Value; readonly label: string }[]
}

export type SettingValue = string | boolean | number | readonly string[]
export type SettingDefinition =
  | BooleanSetting
  | StringSetting
  | NumberSetting
  | SelectSetting
  | MultiSelectSetting
export type SettingsSchema = Readonly<Record<string, SettingDefinition>>
export type SettingsValues<Schema extends SettingsSchema> = {
  -readonly [Key in keyof Schema]: Schema[Key] extends SettingBase<infer Value, string>
    ? Value
    : never
}

function validNumber(definition: NumberSetting, value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  if (definition.min !== undefined && value < definition.min) return false
  if (definition.max !== undefined && value > definition.max) return false
  if (definition.integer === true && !Number.isInteger(value)) return false
  if (definition.step !== undefined) {
    const quotient = (value - (definition.min ?? 0)) / definition.step
    const tolerance = 1e-9 * Math.max(1, Math.abs(quotient))
    if (Math.abs(quotient - Math.round(quotient)) > tolerance) return false
  }
  return true
}

/** Validates and clones a setting value according to its schema definition. */
export function normalizeSettingValue(
  definition: SettingDefinition,
  value: unknown,
): SettingValue | undefined {
  if (definition.kind === 'boolean') return typeof value === 'boolean' ? value : undefined
  if (definition.kind === 'string') return typeof value === 'string' ? value : undefined
  if (definition.kind === 'number') return validNumber(definition, value) ? value : undefined
  if (definition.kind === 'select') {
    return typeof value === 'string'
      && definition.options.some(option => option.value === value)
      ? value
      : undefined
  }
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) return undefined
  const selected = new Set(value)
  if ([...selected].some(item => !definition.options.some(option => option.value === item))) {
    return undefined
  }
  return definition.options
    .filter(option => selected.has(option.value))
    .map(option => option.value)
}

function validateNumberDefinition(definition: Omit<NumberSetting, 'kind'>): NumberSetting {
  for (const [name, value] of [['min', definition.min], ['max', definition.max]] as const) {
    if (value !== undefined && !Number.isFinite(value)) {
      throw new TypeError(`number setting ${name} must be finite`)
    }
  }
  if (definition.min !== undefined && definition.max !== undefined && definition.min > definition.max) {
    throw new RangeError('number setting min cannot exceed max')
  }
  if (definition.step !== undefined && (!Number.isFinite(definition.step) || definition.step <= 0)) {
    throw new RangeError('number setting step must be a positive finite number')
  }
  const result: NumberSetting = { kind: 'number', ...definition }
  if (normalizeSettingValue(result, definition.default) === undefined) {
    throw new RangeError('number setting default is invalid')
  }
  return result
}

export const setting = {
  boolean(definition: Omit<BooleanSetting, 'kind'>): BooleanSetting {
    return { kind: 'boolean', ...definition }
  },
  string(definition: Omit<StringSetting, 'kind'>): StringSetting {
    return { kind: 'string', ...definition }
  },
  number(definition: Omit<NumberSetting, 'kind'>): NumberSetting {
    return validateNumberDefinition(definition)
  },
  select<const Value extends string>(
    definition: Omit<SelectSetting<Value>, 'kind'>,
  ): SelectSetting<Value> {
    return { kind: 'select', ...definition }
  },
  multiSelect<const Value extends string>(
    definition: Omit<MultiSelectSetting<Value>, 'kind'>,
  ): MultiSelectSetting<Value> {
    const result: MultiSelectSetting<Value> = { kind: 'multiSelect', ...definition }
    const normalized = normalizeSettingValue(result, definition.default)
    if (normalized === undefined) throw new RangeError('multiSelect setting default is invalid')
    return { ...result, default: normalized as readonly Value[] }
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
  getSelectionText(): string
  isEditableTarget(target: EventTarget | null): boolean
}

export interface ClipboardService {
  writeText(text: string): Promise<void>
}

export type NetworkTarget =
  | 'luogu'
  | 'codeforces'
  | 'atcoder-problems'
  | 'cph-localhost'
  | 'cph-loopback'

export interface NetworkRequest {
  readonly path: string
  readonly method?: 'GET' | 'POST'
  readonly query?: Readonly<Record<string, string | number | boolean>>
  readonly headers?: Readonly<Record<string, string>>
  readonly body?: string
  readonly responseType: 'json' | 'text'
  readonly timeoutMs?: number
  readonly signal?: AbortSignal
}

export interface NetworkResponse<T> {
  readonly status: number
  readonly ok: boolean
  readonly data: T
}

/** Requests only a closed set of Host-mapped network targets. */
export interface NetworkService {
  request<T>(target: NetworkTarget, request: NetworkRequest): Promise<NetworkResponse<T>>
}

export interface NavigationService {
  navigate(pathOrSameOriginUrl: string): void
  open(pathOrAllowedUrl: string): void
}

export interface FeatureToastOptions {
  readonly message: string
  readonly tone?: 'neutral' | 'success' | 'warning' | 'error'
  readonly durationMs?: number
}

export interface FeatureConfirmOptions {
  readonly title: string
  readonly description: string
  readonly confirmLabel?: string
}

export interface FeaturePromptOptions {
  readonly title: string
  readonly label: string
  readonly initialValue?: string
  readonly maxLength?: number
}

/** Small scope-bound text-only UI primitives for page Features. */
export interface FeatureUiService {
  toast(options: FeatureToastOptions): void
  confirm(options: FeatureConfirmOptions): Promise<boolean>
  prompt(options: FeaturePromptOptions): Promise<string | null>
}

export interface FeatureLogger {
  debug(message: string, ...details: readonly unknown[]): void
  info(message: string, ...details: readonly unknown[]): void
  warn(message: string, ...details: readonly unknown[]): void
  error(message: string, ...details: readonly unknown[]): void
}

export interface EmptyFeatureContext {}

interface BaseFeatureContext<Values extends object> {
  readonly scope: Scope
  readonly signal: AbortSignal
  readonly settings: FeatureSettings<Values>
  readonly storage: FeatureStorage
  readonly dom: ScopedDomService
  readonly clipboard: ClipboardService
  readonly network: NetworkService
  readonly navigation: NavigationService
  readonly ui: FeatureUiService
  readonly log: FeatureLogger
}

export type FeatureContext<
  Values extends object,
  Extension extends object = EmptyFeatureContext,
> = BaseFeatureContext<Values> & Extension

export type MountContext<
  Values extends object,
  Extension extends object = EmptyFeatureContext,
> = FeatureContext<Values, Extension> & {
  readonly route: RouteSnapshot
}

export interface FeatureMetadata {
  readonly id: string
  readonly apiVersion: 1
  readonly title: string
  readonly description: string
  readonly category: string
  readonly defaultEnabled: boolean
  readonly matches: (route: RouteSnapshot) => boolean
  readonly capabilities: readonly FeatureCapability[]
  readonly settings: SettingsSchema
}

type FeatureLifecycle<Context> = {
  bivarianceHack(context: Context): void | Cleanup | Promise<void | Cleanup>
}['bivarianceHack']

export interface FeatureDefinition<
  Schema extends SettingsSchema = SettingsSchema,
  Extension extends object = EmptyFeatureContext,
> extends FeatureMetadata {
  readonly settings: Schema
  readonly activate?: FeatureLifecycle<FeatureContext<SettingsValues<Schema>, Extension>>
  readonly mount?: FeatureLifecycle<MountContext<SettingsValues<Schema>, Extension>>
}

export type AnyFeatureDefinition<
  Extension extends object = EmptyFeatureContext,
> = FeatureDefinition<SettingsSchema, Extension>

/** Preserves the value types described by a feature's settings schema. */
export function defineFeature<
  const Schema extends SettingsSchema,
  Extension extends object = EmptyFeatureContext,
>(
  definition: FeatureDefinition<Schema, Extension>,
): FeatureDefinition<Schema, Extension> {
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
