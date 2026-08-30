import { normalizeSettingValue } from '@exlg/runtime'
import type { FeatureMetadata, KernelController } from '@exlg/runtime'
import type {
  ControlCenterEnvironment,
  FeatureConfigurationController,
  SettingValue,
} from './types'

export const configurationFormat = 'exlg-next-configuration'
export const configurationVersion = 1
export const maximumConfigurationBytes = 1024 * 1024

export interface ExlgConfigurationFeatureV1 {
  readonly enabled: boolean
  readonly settings: Readonly<Record<string, SettingValue>>
}

export interface ExlgConfigurationV1 {
  readonly format: typeof configurationFormat
  readonly version: typeof configurationVersion
  readonly appVersion: string
  readonly exportedAt: string
  readonly features: Readonly<Record<string, ExlgConfigurationFeatureV1>>
}

export interface ValidatedConfigurationFeature {
  readonly id: string
  readonly enabled: boolean
  readonly settings: Readonly<Record<string, SettingValue>>
}

export interface ValidatedConfiguration {
  readonly features: readonly ValidatedConfigurationFeature[]
  readonly ignoredUnknownFeatures: number
  readonly ignoredInvalidSettings: number
}

export interface ConfigurationImportPlan extends ValidatedConfiguration {
  readonly featureUpdates: number
  readonly settingUpdates: number
  readonly enableUpdates: number
  readonly disableUpdates: number
}

export interface ConfigurationApplyResult {
  readonly appliedFeatures: number
  readonly failedFeatures: readonly { readonly id: string; readonly error: string }[]
}

export class ConfigurationFormatError extends Error {}

const dangerousKeys = new Set(['__proto__', 'prototype', 'constructor'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertNoDangerousKeys(value: unknown): void {
  if (!isRecord(value) && !Array.isArray(value)) return
  for (const [key, child] of Object.entries(value)) {
    if (dangerousKeys.has(key)) throw new ConfigurationFormatError('配置包含不安全的键名')
    assertNoDangerousKeys(child)
  }
}

function normalizedSetting(
  feature: FeatureMetadata,
  name: string,
  value: unknown,
): SettingValue | undefined {
  const definition = feature.settings[name]
  return definition ? normalizeSettingValue(definition, value) : undefined
}

function settingValuesEqual(left: SettingValue | undefined, right: SettingValue): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) return left === right
  return left.length === right.length && left.every((value, index) => value === right[index])
}

/** Parses and validates configuration without writing storage or changing Kernel state. */
export function validateConfiguration(
  text: string,
  catalog: readonly FeatureMetadata[],
): ValidatedConfiguration {
  if (new TextEncoder().encode(text).byteLength > maximumConfigurationBytes) {
    throw new ConfigurationFormatError('配置文件超过 1 MiB 限制')
  }
  let raw: unknown
  try { raw = JSON.parse(text) }
  catch { throw new ConfigurationFormatError('配置不是有效的 JSON') }
  assertNoDangerousKeys(raw)
  if (!isRecord(raw) || raw.format !== configurationFormat) {
    throw new ConfigurationFormatError('配置格式标识不正确')
  }
  if (raw.version !== configurationVersion) {
    throw new ConfigurationFormatError('不支持该配置版本')
  }
  if (!isRecord(raw.features)) {
    throw new ConfigurationFormatError('features 必须是对象')
  }

  const catalogById = new Map(catalog.map(feature => [feature.id, feature]))
  const features: ValidatedConfigurationFeature[] = []
  let ignoredUnknownFeatures = 0
  let ignoredInvalidSettings = 0

  for (const [id, candidate] of Object.entries(raw.features)) {
    const feature = catalogById.get(id)
    if (!feature) {
      ignoredUnknownFeatures += 1
      continue
    }
    if (!isRecord(candidate) || typeof candidate.enabled !== 'boolean') {
      ignoredInvalidSettings += 1
      continue
    }
    const sourceSettings = isRecord(candidate.settings) ? candidate.settings : {}
    if (!isRecord(candidate.settings)) ignoredInvalidSettings += 1
    const settings: Record<string, SettingValue> = {}
    for (const [name, value] of Object.entries(sourceSettings)) {
      const normalized = normalizedSetting(feature, name, value)
      if (normalized === undefined) ignoredInvalidSettings += 1
      else settings[name] = normalized
    }
    features.push({ id, enabled: candidate.enabled, settings })
  }
  return { features, ignoredUnknownFeatures, ignoredInvalidSettings }
}

/** Compares a validated merge import with the current exported configuration. */
export function planConfigurationImport(
  validated: ValidatedConfiguration,
  current: ExlgConfigurationV1,
): ConfigurationImportPlan {
  let settingUpdates = 0
  let enableUpdates = 0
  let disableUpdates = 0
  let featureUpdates = 0
  const features: ValidatedConfigurationFeature[] = []
  for (const candidate of validated.features) {
    const existing = current.features[candidate.id]
    const enabledChanged = existing?.enabled !== candidate.enabled
    const settings: Record<string, SettingValue> = {}
    for (const [name, value] of Object.entries(candidate.settings)) {
      if (!settingValuesEqual(existing?.settings[name], value)) settings[name] = value
    }
    const changedSettings = Object.keys(settings).length
    settingUpdates += changedSettings
    if (enabledChanged && candidate.enabled) enableUpdates += 1
    if (enabledChanged && !candidate.enabled) disableUpdates += 1
    if (enabledChanged || changedSettings > 0) {
      featureUpdates += 1
      features.push({ id: candidate.id, enabled: candidate.enabled, settings })
    }
  }
  return {
    ...validated,
    features,
    featureUpdates,
    settingUpdates,
    enableUpdates,
    disableUpdates,
  }
}

/** Exports only enabled state and schema-backed Feature settings. */
export async function createConfigurationExport(options: {
  readonly catalog: readonly FeatureMetadata[]
  readonly kernel: KernelController
  readonly configuration: FeatureConfigurationController
  readonly environment: ControlCenterEnvironment
  readonly now?: () => Date
}): Promise<ExlgConfigurationV1> {
  const features: Record<string, ExlgConfigurationFeatureV1> = {}
  for (const feature of [...options.catalog].sort((a, b) => a.id.localeCompare(b.id))) {
    const values = await options.configuration.getAll(feature)
    const settings: Record<string, SettingValue> = {}
    for (const name of Object.keys(feature.settings).sort()) {
      const value = values[name]
      if (value !== undefined) settings[name] = value
    }
    features[feature.id] = {
      enabled: options.kernel.getFeatureStatus(feature.id).status !== 'disabled',
      settings,
    }
  }
  return {
    format: configurationFormat,
    version: configurationVersion,
    appVersion: options.environment.version,
    exportedAt: (options.now ?? (() => new Date()))().toISOString(),
    features,
  }
}

export function stringifyConfiguration(configuration: ExlgConfigurationV1): string {
  return `${JSON.stringify(configuration, null, 2)}\n`
}

/** Applies independent Feature changes and continues after a per-Feature failure. */
export async function applyConfigurationImport(options: {
  readonly plan: ConfigurationImportPlan
  readonly catalog: readonly FeatureMetadata[]
  readonly kernel: KernelController
  readonly configuration: FeatureConfigurationController
}): Promise<ConfigurationApplyResult> {
  const catalog = new Map(options.catalog.map(feature => [feature.id, feature]))
  let appliedFeatures = 0
  const failedFeatures: { id: string; error: string }[] = []
  for (const update of options.plan.features) {
    const feature = catalog.get(update.id)
    if (!feature) continue
    try {
      const before = options.kernel.getFeatureStatus(feature.id).status !== 'disabled'
      if (Object.keys(update.settings).length > 0) {
        await options.configuration.setMany(feature, update.settings)
      }
      if (before !== update.enabled) {
        await options.kernel.setFeatureEnabled(feature.id, update.enabled)
      }
      else if (before && Object.keys(update.settings).length > 0) {
        await options.kernel.remountFeature(feature.id)
      }
      appliedFeatures += 1
    }
    catch (error) {
      failedFeatures.push({
        id: feature.id,
        error: error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240),
      })
    }
  }
  return { appliedFeatures, failedFeatures }
}
