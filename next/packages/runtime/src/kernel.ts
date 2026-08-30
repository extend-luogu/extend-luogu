import { createScope } from './scope'
import type {
  AnyFeatureDefinition,
  Cleanup,
  EmptyFeatureContext,
  FeatureContext,
  FeatureStatus,
  FeatureStatusSnapshot,
  KernelController,
  MountContext,
  RouteSnapshot,
  RouteSource,
  Scope,
  SettingsSchema,
  SettingsValues,
} from './types'

type AnySettings = SettingsValues<SettingsSchema>

export interface FeatureEnabledStore {
  load(): Promise<Readonly<Record<string, boolean>>>
  set(id: string, enabled: boolean): Promise<void>
}

export interface FeatureContextFactory<Extension extends object = EmptyFeatureContext> {
  activation(
    feature: AnyFeatureDefinition<Extension>,
    scope: Scope,
  ): FeatureContext<AnySettings, Extension>
  mount(
    feature: AnyFeatureDefinition<Extension>,
    scope: Scope,
    route: RouteSnapshot,
  ): MountContext<AnySettings, Extension>
}

export interface KernelOptions<Extension extends object = EmptyFeatureContext> {
  readonly catalog: readonly AnyFeatureDefinition<Extension>[]
  readonly routeSource: RouteSource
  readonly enabledStore: FeatureEnabledStore
  readonly contextFactory: FeatureContextFactory<Extension>
  readonly reportError?: (featureId: string | undefined, error: unknown) => void
}

interface MountRun {
  readonly key: string
  readonly token: number
  readonly scope: Scope
}

interface FeatureRecord<Extension extends object> {
  readonly definition: AnyFeatureDefinition<Extension>
  enabled: boolean
  activated: boolean
  generation: number
  mountToken: number
  status: FeatureStatus
  lastError: string | undefined
  featureScope: Scope | undefined
  mountRun: MountRun | undefined
  queue: Promise<void>
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 240)
  return String(error).slice(0, 240)
}

/** Host-facing implementation of the ExLG lifecycle kernel. */
export class Kernel<Extension extends object = EmptyFeatureContext> implements KernelController {
  readonly #catalog: readonly AnyFeatureDefinition<Extension>[]
  readonly #routeSource: RouteSource
  readonly #enabledStore: FeatureEnabledStore
  readonly #contextFactory: FeatureContextFactory<Extension>
  readonly #reportError: (featureId: string | undefined, error: unknown) => void
  readonly #records = new Map<string, FeatureRecord<Extension>>()
  readonly #listeners = new Set<(status: FeatureStatusSnapshot) => void>()
  #scope: Scope | undefined
  #route: RouteSnapshot | undefined
  #started = false

  constructor(options: KernelOptions<Extension>) {
    this.#catalog = options.catalog
    this.#routeSource = options.routeSource
    this.#enabledStore = options.enabledStore
    this.#contextFactory = options.contextFactory
    this.#reportError = options.reportError ?? (() => undefined)

    for (const definition of this.#catalog) {
      if (this.#records.has(definition.id)) {
        throw new Error(`Duplicate feature id: ${definition.id}`)
      }
      this.#records.set(definition.id, {
        definition,
        enabled: false,
        activated: false,
        generation: 0,
        mountToken: 0,
        status: 'disabled',
        lastError: undefined,
        featureScope: undefined,
        mountRun: undefined,
        queue: Promise.resolve(),
      })
    }
  }

  async start(): Promise<void> {
    if (this.#started) return
    this.#started = true
    this.#scope = createScope(error => this.#reportError(undefined, error))
    this.#route = this.#routeSource.current()
    this.#scope.add(this.#routeSource.subscribe(route => this.#acceptRoute(route)))

    let stored: Readonly<Record<string, boolean>> = {}
    try {
      stored = await this.#enabledStore.load()
    }
    catch (error) {
      this.#reportError(undefined, error)
    }

    for (const record of this.#records.values()) {
      const enabled = stored[record.definition.id] ?? record.definition.defaultEnabled
      if (enabled) this.#enable(record)
      else this.#setStatus(record, 'disabled')
    }
  }

  async stop(): Promise<void> {
    if (!this.#started) return
    this.#started = false
    for (const record of this.#records.values()) {
      record.enabled = false
      record.activated = false
      record.generation += 1
      record.mountRun = undefined
      record.featureScope = undefined
      this.#setStatus(record, 'disabled')
    }
    const scope = this.#scope
    this.#scope = undefined
    await scope?.dispose()
  }

  async setFeatureEnabled(id: string, enabled: boolean): Promise<void> {
    const record = this.#requireRecord(id)
    await this.#enabledStore.set(id, enabled)
    if (enabled === record.enabled) return
    if (enabled) this.#enable(record)
    else await this.#disable(record)
  }

  remountFeature(id: string): Promise<void> {
    const record = this.#requireRecord(id)
    if (!record.enabled || !record.activated) return Promise.resolve()
    return this.#enqueue(record, () => this.#reconcile(record, true))
  }

  async retryFeature(id: string): Promise<void> {
    const record = this.#requireRecord(id)
    if (!record.enabled) return
    await this.#restart(record)
  }

  getFeatureStatus(id: string): FeatureStatusSnapshot {
    return this.#snapshot(this.#requireRecord(id))
  }

  subscribeFeatureStatus(listener: (status: FeatureStatusSnapshot) => void): Cleanup {
    this.#listeners.add(listener)
    for (const record of this.#records.values()) listener(this.#snapshot(record))
    return () => {
      this.#listeners.delete(listener)
    }
  }

  #requireRecord(id: string): FeatureRecord<Extension> {
    const record = this.#records.get(id)
    if (!record) throw new Error(`Unknown feature: ${id}`)
    return record
  }

  #acceptRoute(route: RouteSnapshot): void {
    if (!this.#started) return
    if (this.#route?.key === route.key) return
    this.#route = route
    for (const record of this.#records.values()) {
      if (record.enabled && record.activated) {
        void this.#enqueue(record, () => this.#reconcile(record))
      }
    }
  }

  #enable(record: FeatureRecord<Extension>): void {
    if (!this.#started || !this.#scope) return
    record.enabled = true
    record.activated = false
    record.lastError = undefined
    record.generation += 1
    const generation = record.generation
    const featureScope = this.#scope.child()
    record.featureScope = featureScope
    record.mountRun = undefined
    this.#setStatus(record, 'idle')
    void this.#activate(record, generation, featureScope)
  }

  async #activate(record: FeatureRecord<Extension>, generation: number, scope: Scope): Promise<void> {
    try {
      const context = this.#contextFactory.activation(record.definition, scope)
      const cleanup = await record.definition.activate?.(context)
      if (typeof cleanup === 'function') scope.add(cleanup)
      if (!this.#isCurrent(record, generation, scope)) return
      record.activated = true
      await this.#enqueue(record, () => this.#reconcile(record))
    }
    catch (error) {
      if (!this.#isCurrent(record, generation, scope)) return
      record.activated = false
      this.#recordError(record, error)
    }
  }

  async #disable(record: FeatureRecord<Extension>): Promise<void> {
    record.enabled = false
    record.activated = false
    record.generation += 1
    record.mountRun = undefined
    const scope = record.featureScope
    record.featureScope = undefined
    this.#setStatus(record, 'disabled')
    await scope?.dispose()
  }

  async #restart(record: FeatureRecord<Extension>): Promise<void> {
    record.activated = false
    record.generation += 1
    record.mountRun = undefined
    const oldScope = record.featureScope
    record.featureScope = undefined
    await oldScope?.dispose()
    if (!record.enabled || !this.#started || !this.#scope) return
    this.#enable(record)
  }

  #enqueue(record: FeatureRecord<Extension>, operation: () => Promise<void>): Promise<void> {
    const run = record.queue.then(operation, operation)
    record.queue = run.catch(error => this.#recordError(record, error))
    return run
  }

  async #reconcile(record: FeatureRecord<Extension>, force = false): Promise<void> {
    const route = this.#route
    const featureScope = record.featureScope
    const generation = record.generation
    if (!route || !featureScope || !record.enabled || !record.activated) return

    let matches = false
    try {
      matches = record.definition.matches(route)
    }
    catch (error) {
      this.#recordError(record, error)
      return
    }

    if (!matches) {
      await this.#disposeMount(record)
      if (this.#isCurrent(record, generation, featureScope)) this.#setStatus(record, 'idle')
      return
    }

    if (!force && record.mountRun?.key === route.key) return
    await this.#disposeMount(record)
    if (!this.#isCurrent(record, generation, featureScope)) return
    if (this.#route?.key !== route.key) return

    const mountScope = featureScope.child()
    const token = ++record.mountToken
    const mountRun: MountRun = { key: route.key, token, scope: mountScope }
    record.mountRun = mountRun
    record.lastError = undefined
    this.#setStatus(record, 'mounting')
    void this.#runMount(record, generation, mountRun, route)
  }

  async #runMount(
    record: FeatureRecord<Extension>,
    generation: number,
    mountRun: MountRun,
    route: RouteSnapshot,
  ): Promise<void> {
    try {
      const context = this.#contextFactory.mount(record.definition, mountRun.scope, route)
      const cleanup = await record.definition.mount?.(context)
      if (typeof cleanup === 'function') mountRun.scope.add(cleanup)
      if (!this.#isMountCurrent(record, generation, mountRun)) return
      this.#setStatus(record, 'mounted')
    }
    catch (error) {
      if (!this.#isMountCurrent(record, generation, mountRun)) return
      record.mountRun = undefined
      await mountRun.scope.dispose()
      this.#recordError(record, error)
    }
  }

  async #disposeMount(record: FeatureRecord<Extension>): Promise<void> {
    const mount = record.mountRun
    if (!mount) return
    record.mountRun = undefined
    record.mountToken += 1
    await mount.scope.dispose()
  }

  #isCurrent(record: FeatureRecord<Extension>, generation: number, scope: Scope): boolean {
    return this.#started
      && record.enabled
      && record.generation === generation
      && record.featureScope === scope
      && !scope.disposed
  }

  #isMountCurrent(record: FeatureRecord<Extension>, generation: number, mount: MountRun): boolean {
    return record.generation === generation
      && record.mountRun === mount
      && record.enabled
      && !mount.scope.disposed
  }

  #recordError(record: FeatureRecord<Extension>, error: unknown): void {
    record.lastError = errorMessage(error)
    this.#reportError(record.definition.id, error)
    this.#setStatus(record, 'error')
  }

  #setStatus(record: FeatureRecord<Extension>, status: FeatureStatus): void {
    record.status = status
    const snapshot = this.#snapshot(record)
    for (const listener of this.#listeners) {
      try {
        listener(snapshot)
      }
      catch (error) {
        this.#reportError(undefined, error)
      }
    }
  }

  #snapshot(record: FeatureRecord<Extension>): FeatureStatusSnapshot {
    const result: {
      id: string
      status: FeatureStatus
      lastError?: string
      routeKey?: string
    } = {
      id: record.definition.id,
      status: record.status,
    }
    if (record.lastError !== undefined) result.lastError = record.lastError
    if (record.mountRun !== undefined) result.routeKey = record.mountRun.key
    return result
  }
}
