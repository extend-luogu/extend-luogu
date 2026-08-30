import type { JSX } from 'preact'
import { Icon, type IconName } from '../icons'
import type { ControlCenterView } from '../types'

const entries: readonly { view: ControlCenterView; label: string; icon: IconName }[] = [
  { view: 'overview', label: '总览', icon: 'home' },
  { view: 'features', label: '功能', icon: 'features' },
  { view: 'data', label: '数据', icon: 'database' },
  { view: 'diagnostics', label: '诊断', icon: 'diagnostics' },
  { view: 'preferences', label: '面板设置', icon: 'settings' },
]

export function Navigation(props: {
  readonly current: ControlCenterView
  readonly onSelect: (view: ControlCenterView) => void
}): JSX.Element {
  return <nav aria-label="控制中心导航" class="navigation">
    {entries.map(entry => <button
      aria-current={props.current === entry.view ? 'page' : undefined}
      class="nav-item"
      key={entry.view}
      onClick={() => props.onSelect(entry.view)}
      type="button"
    >
      <Icon name={entry.icon}/>
      <span>{entry.label}</span>
    </button>)}
  </nav>
}
