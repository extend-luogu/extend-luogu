import {
  BrowserFeatureServices,
  createDomEnvironment,
  NamespacedEnabledStore,
} from '@exlg/browser'
import { featureCatalog } from '@exlg/features'
import { LuoguRouteSource } from '@exlg/luogu'
import { createScope } from '@exlg/runtime'
import { Kernel } from '@exlg/runtime/internal'
import { mountSettingsPanel } from '@exlg/ui'
import { installUserscriptHistoryBridge } from './bridge'
import { UserscriptStore, userscriptClipboard } from './platform'

export async function bootstrapUserscript(): Promise<void> {
  const appScope = createScope(error => console.error('[ExLG Next]', error))
  appScope.add(installUserscriptHistoryBridge())

  const store = new UserscriptStore()
  const services = new BrowserFeatureServices({
    store,
    clipboard: userscriptClipboard,
    dom: createDomEnvironment(document, error => console.error('[ExLG Next/DOM]', error)),
  })
  const kernel = new Kernel({
    catalog: featureCatalog,
    routeSource: new LuoguRouteSource(window),
    enabledStore: new NamespacedEnabledStore(store),
    contextFactory: services,
    reportError: (featureId, error) => console.error(`[ExLG Next/${featureId ?? 'kernel'}]`, error),
  })
  appScope.add(() => kernel.stop())
  appScope.add(mountSettingsPanel({
    document,
    catalog: featureCatalog,
    kernel,
    settings: {
      getAll: feature => services.getSettingValues(feature),
      set: (feature, name, value) => services.setSettingValue(feature, name, value),
    },
  }))
  const stop = (): void => { void appScope.dispose() }
  window.addEventListener('pagehide', stop, { once: true })
  appScope.add(() => window.removeEventListener('pagehide', stop))

  try {
    await kernel.start()
  }
  catch (error) {
    await appScope.dispose()
    throw error
  }
}
