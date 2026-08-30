import type {
  FeatureMetadata,
  FeatureContext,
  FeatureLogger,
  FeatureSettings,
  FeatureStorage,
  JsonValue,
  MountContext,
  RouteSnapshot,
  Scope,
  SettingsSchema,
  SettingsValues,
} from '@exlg/runtime'
import { createScopedDomService } from './dom'
import type { DomEnvironment } from './dom'

export interface JsonKeyValueStore {
  get(key: string): Promise<unknown>
  set(key: string, value: JsonValue): Promise<void>
  delete(key: string): Promise<void>
}

export interface BrowserFeatureServicesOptions {
  readonly store: JsonKeyValueStore
  readonly configuration: BrowserFeatureConfigurationController
  readonly dom: DomEnvironment
  readonly clipboard: { writeText(text: string): Promise<void> }
  readonly console?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>
}

type AnySettings = SettingsValues<SettingsSchema>
type SettingsRecord = Record<string, string | boolean>

export interface BrowserFeatureConfigurationController {
  getAll(feature: FeatureMetadata): Promise<Readonly<SettingsRecord>>
  set(feature: FeatureMetadata, name: string, value: string | boolean): Promise<void>
  setMany(
    feature: FeatureMetadata,
    values: Readonly<SettingsRecord>,
  ): Promise<void>
  reset(feature: FeatureMetadata): Promise<void>
  settings(feature: FeatureMetadata): FeatureSettings<AnySettings>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function storedValues(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}
  return isRecord(value.values) ? value.values : {}
}

function validSettingValue(
  definition: FeatureMetadata['settings'][string],
  value: unknown,
): value is string | boolean {
  if (!definition) return false
  if (definition.kind === 'boolean') return typeof value === 'boolean'
  if (definition.kind === 'string') return typeof value === 'string'
  return typeof value === 'string'
    && definition.options.some(option => option.value === value)
}

export class NamespacedEnabledStore {
  readonly #store: JsonKeyValueStore
  readonly #key = 'exlg:vnext:enabled'
  #writeQueue = Promise.resolve()

  constructor(store: JsonKeyValueStore) {
    this.#store = store
  }

  async load(): Promise<Readonly<Record<string, boolean>>> {
    const raw = await this.#store.get(this.#key)
    if (!isRecord(raw)) return {}
    const values: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'boolean') values[key] = value
    }
    return values
  }

  set(id: string, enabled: boolean): Promise<void> {
    const write = this.#writeQueue.then(async () => {
      const values = { ...await this.load(), [id]: enabled }
      await this.#store.set(this.#key, values)
    })
    this.#writeQueue = write.catch(() => undefined)
    return write
  }
}

/** A JSON value backend permanently bound to one storage namespace. */
export class NamespacedJsonValueStore {
  readonly #store: JsonKeyValueStore
  readonly #key: string

  constructor(store: JsonKeyValueStore, key: string) {
    this.#store = store
    this.#key = key
  }

  load(): Promise<unknown> {
    return this.#store.get(this.#key)
  }

  save(value: JsonValue): Promise<void> {
    return this.#store.set(this.#key, value)
  }

  reset(): Promise<void> {
    return this.#store.delete(this.#key)
  }
}

/** Shared validated settings implementation for Feature contexts and system UI. */
export class FeatureConfigurationController implements BrowserFeatureConfigurationController {
  readonly #store: JsonKeyValueStore
  readonly #queues = new Map<string, Promise<void>>()

  constructor(store: JsonKeyValueStore) {
    this.#store = store
  }

  async getAll(feature: FeatureMetadata): Promise<Readonly<SettingsRecord>> {
    const values = storedValues(await this.#store.get(this.#key(feature)))
    const result: SettingsRecord = {}
    for (const [name, definition] of Object.entries(feature.settings)) {
      const value = values[name]
      result[name] = validSettingValue(definition, value) ? value : definition.default
    }
    return result
  }

  set(feature: FeatureMetadata, name: string, value: string | boolean): Promise<void> {
    return this.setMany(feature, { [name]: value })
  }

  setMany(
    feature: FeatureMetadata,
    values: Readonly<SettingsRecord>,
  ): Promise<void> {
    for (const [name, value] of Object.entries(values)) {
      const definition = feature.settings[name]
      if (!definition || !validSettingValue(definition, value)) {
        return Promise.reject(new TypeError(`Invalid setting ${name} for ${feature.id}`))
      }
    }
    return this.#enqueue(feature.id, async () => {
      const next = { ...await this.getAll(feature), ...values }
      await this.#store.set(this.#key(feature), { settingsVersion: 1, values: next })
    })
  }

  reset(feature: FeatureMetadata): Promise<void> {
    return this.#enqueue(feature.id, () => this.#store.delete(this.#key(feature)))
  }

  settings(feature: FeatureMetadata): FeatureSettings<AnySettings> {
    return {
      get: async name => (await this.getAll(feature))[String(name)] as AnySettings[typeof name],
      getAll: async () => await this.getAll(feature) as AnySettings,
      set: async (name, value) => {
        await this.set(feature, String(name), value)
      },
    }
  }

  #key(feature: FeatureMetadata): string {
    return `exlg:vnext:settings:${feature.id}`
  }

  #enqueue(featureId: string, operation: () => Promise<void>): Promise<void> {
    const previous = this.#queues.get(featureId) ?? Promise.resolve()
    const next = previous.then(operation, operation)
    this.#queues.set(featureId, next.catch(() => undefined))
    return next
  }
}

export class BrowserFeatureServices {
  readonly #store: JsonKeyValueStore
  readonly #configuration: BrowserFeatureConfigurationController
  readonly #dom: DomEnvironment
  readonly #clipboard: BrowserFeatureServicesOptions['clipboard']
  readonly #console: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>
  readonly #dataQueues = new Map<string, Promise<void>>()

  constructor(options: BrowserFeatureServicesOptions) {
    this.#store = options.store
    this.#configuration = options.configuration
    this.#dom = options.dom
    this.#clipboard = options.clipboard
    this.#console = options.console ?? console
  }

  activation(feature: FeatureMetadata, scope: Scope): FeatureContext<AnySettings> {
    return this.#context(feature, scope)
  }

  mount(
    feature: FeatureMetadata,
    scope: Scope,
    route: RouteSnapshot,
  ): MountContext<AnySettings> {
    return { ...this.#context(feature, scope), route }
  }

  settings(feature: FeatureMetadata): FeatureSettings<AnySettings> {
    return this.#configuration.settings(feature)
  }

  storage(featureId: string): FeatureStorage {
    const namespace = `exlg:vnext:data:${featureId}`
    const read = async (): Promise<Record<string, JsonValue>> => {
      const values = storedValues(await this.#store.get(namespace))
      return values as Record<string, JsonValue>
    }
    const write = (operation: () => Promise<void>): Promise<void> => {
      const previous = this.#dataQueues.get(namespace) ?? Promise.resolve()
      const next = previous.then(operation, operation)
      this.#dataQueues.set(namespace, next.catch(() => undefined))
      return next
    }
    return {
      async get<T extends JsonValue>(name: string, fallback?: T) {
        const value = (await read())[name]
        return (value === undefined ? fallback : value) as T | undefined
      },
      set: (name, value) => write(async () => {
        const values = { ...await read(), [name]: value }
        await this.#store.set(namespace, { schemaVersion: 1, values })
      }),
      delete: name => write(async () => {
        const values = await read()
        delete values[name]
        await this.#store.set(namespace, { schemaVersion: 1, values })
      }),
      update: async <T extends JsonValue>(
        name: string,
        updater: (current: T | undefined) => T,
        fallback?: T,
      ): Promise<T> => {
        let result: T | undefined
        await write(async () => {
          const values = await read()
          const current = (values[name] as T | undefined) ?? fallback
          result = updater(current)
          values[name] = result
          await this.#store.set(namespace, { schemaVersion: 1, values })
        })
        return result as T
      },
    }
  }

  #context(feature: FeatureMetadata, scope: Scope): FeatureContext<AnySettings> {
    return {
      scope,
      signal: scope.signal,
      settings: this.settings(feature),
      storage: this.storage(feature.id),
      dom: createScopedDomService(this.#dom, scope),
      clipboard: this.#clipboard,
      log: this.#logger(feature.id),
    }
  }

  #logger(featureId: string): FeatureLogger {
    const prefix = `[ExLG Next/${featureId}]`
    return {
      debug: (message, ...details) => this.#console.debug(prefix, message, ...details),
      info: (message, ...details) => this.#console.info(prefix, message, ...details),
      warn: (message, ...details) => this.#console.warn(prefix, message, ...details),
      error: (message, ...details) => this.#console.error(prefix, message, ...details),
    }
  }
}
