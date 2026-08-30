import {
  BrowserFeatureServices,
  createDomEnvironment,
  FeatureConfigurationController,
  NamespacedEnabledStore,
  NamespacedJsonValueStore,
} from '@exlg/browser'
import {
  createControlCenterPreferencesStore,
  mountControlCenter,
} from '@exlg/control-center'
import { featureCatalog } from '@exlg/features'
import {
  createLuoguFeatureServices,
  LuoguRouteSource,
} from '@exlg/luogu'
import type { LuoguFeatureContextExtension } from '@exlg/luogu'
import { createScope } from '@exlg/runtime'
import { Kernel } from '@exlg/runtime/internal'
import type { FeatureContextFactory } from '@exlg/runtime/internal'
import workspaceManifest from '../../../package.json'
import { installUserscriptHistoryBridge } from './bridge'
import { UserscriptStore, userscriptClipboard } from './platform'

export async function bootstrapUserscript(): Promise<void> {
  const appScope = createScope(error => console.error('[ExLG Next]', error))
  appScope.add(installUserscriptHistoryBridge())

  const store = new UserscriptStore()
  const configuration = new FeatureConfigurationController(store)
  const services = new BrowserFeatureServices({
    store,
    configuration,
    clipboard: userscriptClipboard,
    dom: createDomEnvironment(document, error => console.error('[ExLG Next/DOM]', error)),
  })
  const luogu = createLuoguFeatureServices(window)
  const contextFactory: FeatureContextFactory<LuoguFeatureContextExtension> = {
    activation: (feature, scope) => ({ ...services.activation(feature, scope), luogu }),
    mount: (feature, scope, route) => ({ ...services.mount(feature, scope, route), luogu }),
  }
  const routeSource = new LuoguRouteSource(window)
  const kernel = new Kernel<LuoguFeatureContextExtension>({
    catalog: featureCatalog,
    routeSource,
    enabledStore: new NamespacedEnabledStore(store),
    contextFactory,
    reportError: (featureId, error) => console.error(`[ExLG Next/${featureId ?? 'kernel'}]`, error),
  })
  appScope.add(() => kernel.stop())
  const preferenceStorage = new NamespacedJsonValueStore(store, 'exlg:vnext:control-center')
  appScope.add(mountControlCenter({
    document,
    catalog: featureCatalog,
    kernel,
    routeSource,
    configuration,
    preferences: createControlCenterPreferencesStore({
      load: () => preferenceStorage.load(),
      save: value => preferenceStorage.save({ ...value }),
      reset: () => preferenceStorage.reset(),
    }),
    clipboard: userscriptClipboard,
    environment: {
      host: 'userscript',
      version: workspaceManifest.version,
      development: import.meta.env.DEV,
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
