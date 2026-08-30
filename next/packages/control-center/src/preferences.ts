import type {
  ControlCenterPreferences,
  ControlCenterPreferencesBackend,
  ControlCenterPreferencesStore,
} from './types'

export const defaultControlCenterPreferences: ControlCenterPreferences = {
  theme: 'system',
  density: 'comfortable',
  launcherSide: 'right',
  lastView: 'overview',
}

const themes = new Set(['system', 'light', 'dark'])
const densities = new Set(['comfortable', 'compact'])
const sides = new Set(['left', 'right'])
const views = new Set(['overview', 'features', 'data', 'diagnostics', 'preferences'])

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function validateControlCenterPreferences(value: unknown): ControlCenterPreferences {
  const raw = record(value)
  return {
    theme: typeof raw.theme === 'string' && themes.has(raw.theme)
      ? raw.theme as ControlCenterPreferences['theme']
      : defaultControlCenterPreferences.theme,
    density: typeof raw.density === 'string' && densities.has(raw.density)
      ? raw.density as ControlCenterPreferences['density']
      : defaultControlCenterPreferences.density,
    launcherSide: typeof raw.launcherSide === 'string' && sides.has(raw.launcherSide)
      ? raw.launcherSide as ControlCenterPreferences['launcherSide']
      : defaultControlCenterPreferences.launcherSide,
    lastView: typeof raw.lastView === 'string' && views.has(raw.lastView)
      ? raw.lastView as ControlCenterPreferences['lastView']
      : defaultControlCenterPreferences.lastView,
  }
}

/** Builds a preference store over a backend already bound to the system namespace. */
export function createControlCenterPreferencesStore(
  backend: ControlCenterPreferencesBackend,
): ControlCenterPreferencesStore {
  return {
    async load() {
      try {
        return validateControlCenterPreferences(await backend.load())
      }
      catch {
        return defaultControlCenterPreferences
      }
    },
    save: preferences => backend.save(preferences),
    reset: () => backend.reset(),
  }
}
