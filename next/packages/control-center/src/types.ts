import type {
  ClipboardService,
  FeatureMetadata,
  KernelController,
  RouteSource,
  SettingValue as RuntimeSettingValue,
} from '@exlg/runtime'

export type SettingValue = RuntimeSettingValue
export type ControlCenterView =
  | 'overview'
  | 'features'
  | 'data'
  | 'diagnostics'
  | 'preferences'

/** Validated access to official Feature settings, never Feature business data. */
export interface FeatureConfigurationController {
  getAll(feature: FeatureMetadata): Promise<Readonly<Record<string, SettingValue>>>
  set(feature: FeatureMetadata, name: string, value: SettingValue): Promise<void>
  setMany(
    feature: FeatureMetadata,
    values: Readonly<Record<string, SettingValue>>,
  ): Promise<void>
  reset(feature: FeatureMetadata): Promise<void>
}

export interface ControlCenterPreferences {
  readonly theme: 'system' | 'light' | 'dark'
  readonly density: 'comfortable' | 'compact'
  readonly launcherSide: 'left' | 'right'
  readonly lastView: ControlCenterView
}

export interface ControlCenterPreferencesStore {
  load(): Promise<ControlCenterPreferences>
  save(preferences: ControlCenterPreferences): Promise<void>
  reset(): Promise<void>
}

export interface ControlCenterPreferencesBackend {
  load(): Promise<unknown>
  save(value: ControlCenterPreferences): Promise<void>
  reset(): Promise<void>
}

export interface ControlCenterEnvironment {
  readonly host: 'userscript' | 'webextension'
  readonly version: string
  readonly development: boolean
}

export interface MountControlCenterOptions {
  readonly document: Document
  readonly catalog: readonly FeatureMetadata[]
  readonly kernel: KernelController
  readonly routeSource: RouteSource
  readonly configuration: FeatureConfigurationController
  readonly preferences: ControlCenterPreferencesStore
  readonly clipboard: ClipboardService
  readonly environment: ControlCenterEnvironment
}
