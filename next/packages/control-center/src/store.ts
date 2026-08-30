import type {
  Cleanup,
  FeatureStatusSnapshot,
  KernelController,
  RouteSnapshot,
  RouteSource,
} from '@exlg/runtime'
import { sanitizeDiagnosticText } from './diagnostics'
import { defaultControlCenterPreferences } from './preferences'
import type {
  ControlCenterPreferences,
  ControlCenterPreferencesStore,
  ControlCenterView,
} from './types'

export interface ObservedFeatureError {
  readonly featureId: string
  readonly message: string
  readonly routeKey?: string
  readonly sequence: number
}

export interface ControlCenterSnapshot {
  readonly open: boolean
  readonly view: ControlCenterView
  readonly detailFeatureId: string | undefined
  readonly route: RouteSnapshot
  readonly statuses: ReadonlyMap<string, FeatureStatusSnapshot>
  readonly errors: readonly ObservedFeatureError[]
  readonly preferences: ControlCenterPreferences
  readonly preferencesReady: boolean
  readonly searchFocusRequest: number
}

export interface ControlCenterStoreOptions {
  readonly kernel: KernelController
  readonly routeSource: RouteSource
  readonly preferences: ControlCenterPreferencesStore
}

export class ControlCenterStore {
  readonly #kernel: KernelController
  readonly #routeSource: RouteSource
  readonly #preferencesStore: ControlCenterPreferencesStore
  readonly #listeners = new Set<() => void>()
  readonly #cleanups: Cleanup[] = []
  readonly #abortController = new AbortController()
  #snapshot: ControlCenterSnapshot
  #started = false
  #disposed = false
  #preferenceGeneration = 0
  #errorSequence = 0

  constructor(options: ControlCenterStoreOptions) {
    this.#kernel = options.kernel
    this.#routeSource = options.routeSource
    this.#preferencesStore = options.preferences
    this.#snapshot = {
      open: false,
      view: defaultControlCenterPreferences.lastView,
      detailFeatureId: undefined,
      route: options.routeSource.current(),
      statuses: new Map(),
      errors: [],
      preferences: defaultControlCenterPreferences,
      preferencesReady: false,
      searchFocusRequest: 0,
    }
  }

  get signal(): AbortSignal {
    return this.#abortController.signal
  }

  getSnapshot = (): ControlCenterSnapshot => this.#snapshot

  subscribe = (listener: () => void): Cleanup => {
    this.#listeners.add(listener)
    return () => { this.#listeners.delete(listener) }
  }

  async start(): Promise<void> {
    if (this.#started || this.#disposed) return
    this.#started = true
    this.#cleanups.push(this.#routeSource.subscribe(route => {
      if (this.#disposed) return
      this.#update({ route })
    }))
    this.#cleanups.push(this.#kernel.subscribeFeatureStatus(status => {
      if (this.#disposed) return
      const previous = this.#snapshot.statuses.get(status.id)
      const statuses = new Map(this.#snapshot.statuses)
      statuses.set(status.id, status)
      let errors = this.#snapshot.errors
      if (status.status === 'error'
        && (previous?.status !== 'error' || previous.lastError !== status.lastError)) {
        const message = sanitizeDiagnosticText(status.lastError) ?? '未知错误'
        const observed: ObservedFeatureError = {
          featureId: status.id,
          message,
          sequence: ++this.#errorSequence,
          ...(status.routeKey === undefined ? {} : { routeKey: status.routeKey }),
        }
        errors = [...errors, observed].slice(-20)
      }
      this.#update({ statuses, errors })
    }))

    const generation = ++this.#preferenceGeneration
    const preferences = await this.#preferencesStore.load()
    if (this.#disposed || generation !== this.#preferenceGeneration) return
    this.#update({ preferences, view: preferences.lastView, preferencesReady: true })
  }

  open(): void {
    this.#update({ open: true })
  }

  close(): void {
    this.#update({ open: false, detailFeatureId: undefined })
  }

  toggle(): void {
    if (this.#snapshot.open) this.close()
    else this.open()
  }

  showView(view: ControlCenterView): void {
    this.#update({ view, detailFeatureId: undefined })
    void this.updatePreferences({ ...this.#snapshot.preferences, lastView: view })
  }

  showFeature(featureId: string): void {
    this.#update({ view: 'features', detailFeatureId: featureId })
  }

  showFeatureSearch(): void {
    this.#update({
      open: true,
      view: 'features',
      detailFeatureId: undefined,
      searchFocusRequest: this.#snapshot.searchFocusRequest + 1,
    })
  }

  async updatePreferences(preferences: ControlCenterPreferences): Promise<void> {
    const previous = this.#snapshot.preferences
    const generation = ++this.#preferenceGeneration
    this.#update({ preferences })
    try {
      await this.#preferencesStore.save(preferences)
    }
    catch (error) {
      if (!this.#disposed && generation === this.#preferenceGeneration) {
        this.#update({ preferences: previous })
      }
      throw error
    }
  }

  async resetPreferences(): Promise<void> {
    const generation = ++this.#preferenceGeneration
    await this.#preferencesStore.reset()
    if (this.#disposed || generation !== this.#preferenceGeneration) return
    this.#update({
      preferences: defaultControlCenterPreferences,
      view: defaultControlCenterPreferences.lastView,
    })
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return
    this.#disposed = true
    this.#abortController.abort()
    for (const cleanup of this.#cleanups.reverse()) {
      try { await cleanup() }
      catch { /* A system UI cleanup must not block host disposal. */ }
    }
    this.#cleanups.length = 0
    this.#listeners.clear()
  }

  #update(patch: Partial<ControlCenterSnapshot>): void {
    if (this.#disposed) return
    this.#snapshot = { ...this.#snapshot, ...patch }
    for (const listener of [...this.#listeners]) listener()
  }
}
