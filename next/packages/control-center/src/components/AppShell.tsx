import type { ComponentChildren, JSX } from 'preact'
import { Icon } from '../icons'
import type { ControlCenterView } from '../types'
import { Navigation } from './Navigation'

export function AppShell(props: {
  readonly currentView: ControlCenterView
  readonly panelRef: (node: HTMLElement | null) => void
  readonly onClose: () => void
  readonly onNavigate: (view: ControlCenterView) => void
  readonly children: ComponentChildren
}): JSX.Element {
  return <div class="open-layer">
    <button aria-label="关闭控制中心" class="backdrop" onClick={props.onClose} type="button"/>
    <section
      aria-labelledby="control-center-title"
      aria-modal="true"
      class="panel"
      ref={props.panelRef}
      role="dialog"
      tabIndex={-1}
    >
      <header class="panel-header">
        <div>
          <span class="eyebrow">EXLG NEXT</span>
          <h1 id="control-center-title">控制中心</h1>
        </div>
        <button aria-label="关闭控制中心" class="icon-button" onClick={props.onClose} type="button">
          <Icon name="close"/>
        </button>
      </header>
      <div class="panel-body">
        <Navigation current={props.currentView} onSelect={props.onNavigate}/>
        <main class="view-container">{props.children}</main>
      </div>
    </section>
  </div>
}
