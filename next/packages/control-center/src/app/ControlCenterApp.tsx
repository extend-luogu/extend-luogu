import type { JSX } from 'preact'
import { useLayoutEffect, useRef, useState } from 'preact/hooks'
import type { MountControlCenterOptions } from '../types'
import type { ControlCenterSnapshot, ControlCenterStore } from '../store'
import { AppShell } from '../components/AppShell'
import { Launcher } from '../components/Launcher'
import { OverviewView } from '../views/OverviewView'
import { FeaturesView } from '../views/FeaturesView'
import { FeatureDetailView } from '../views/FeatureDetailView'
import { DataView } from '../views/DataView'
import { DiagnosticsView } from '../views/DiagnosticsView'
import { PreferencesView } from '../views/PreferencesView'
import { ErrorBoundary } from './ErrorBoundary'

function useStore(store: ControlCenterStore): ControlCenterSnapshot {
  const [snapshot, setSnapshot] = useState(store.getSnapshot())
  useLayoutEffect(() => store.subscribe(() => setSnapshot(store.getSnapshot())), [store])
  return snapshot
}

export function ControlCenterApp(props: {
  readonly options: MountControlCenterOptions
  readonly store: ControlCenterStore
}): JSX.Element {
  const snapshot = useStore(props.store)
  const launcher = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const wasOpen = useRef(false)
  const [boundaryGeneration, setBoundaryGeneration] = useState(0)

  useLayoutEffect(() => {
    if (snapshot.open) panel.current?.focus()
    else if (wasOpen.current) launcher.current?.focus()
    wasOpen.current = snapshot.open
  }, [snapshot.open])

  const content = (): JSX.Element => {
    const detail = snapshot.detailFeatureId === undefined
      ? undefined
      : props.options.catalog.find(feature => feature.id === snapshot.detailFeatureId)
    if (detail) {
      return <FeatureDetailView
        configuration={props.options.configuration}
        feature={detail}
        kernel={props.options.kernel}
        onBack={() => props.store.showView('features')}
        signal={props.store.signal}
        status={snapshot.statuses.get(detail.id) ?? { id: detail.id, status: 'disabled' }}
      />
    }
    switch (snapshot.view) {
      case 'features': return <FeaturesView
        catalog={props.options.catalog}
        kernel={props.options.kernel}
        onOpenFeature={id => props.store.showFeature(id)}
        searchFocusRequest={snapshot.searchFocusRequest}
        statuses={snapshot.statuses}
      />
      case 'data': return <DataView
        catalog={props.options.catalog}
        clipboard={props.options.clipboard}
        configuration={props.options.configuration}
        document={props.options.document}
        environment={props.options.environment}
        kernel={props.options.kernel}
        signal={props.store.signal}
      />
      case 'diagnostics': return <DiagnosticsView
        catalog={props.options.catalog}
        clipboard={props.options.clipboard}
        environment={props.options.environment}
        errors={snapshot.errors}
        route={snapshot.route}
        statuses={snapshot.statuses}
      />
      case 'preferences': return <PreferencesView preferences={snapshot.preferences} store={props.store}/>
      default: return <OverviewView
        catalog={props.options.catalog}
        environment={props.options.environment}
        onShowFeature={id => props.store.showFeature(id)}
        onShowFeatures={() => props.store.showView('features')}
        route={snapshot.route}
        statuses={snapshot.statuses}
      />
    }
  }

  return <>
    <Launcher
      buttonRef={node => { launcher.current = node }}
      onToggle={() => props.store.toggle()}
      open={snapshot.open}
    />
    {snapshot.open && <ErrorBoundary
      key={boundaryGeneration}
      onClose={() => props.store.close()}
      onReload={() => setBoundaryGeneration(value => value + 1)}
    >
      <AppShell
        currentView={snapshot.view}
        onClose={() => props.store.close()}
        onNavigate={view => props.store.showView(view)}
        panelRef={node => { panel.current = node }}
      >{content()}</AppShell>
    </ErrorBoundary>}
  </>
}
