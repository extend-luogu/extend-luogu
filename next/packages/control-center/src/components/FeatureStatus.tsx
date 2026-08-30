import type { JSX } from 'preact'
import type { FeatureStatus as Status } from '@exlg/runtime'
import { statusLabels } from '../labels'

export function FeatureStatus(props: {
  readonly status: Status
  readonly compact?: boolean
}): JSX.Element {
  const label = statusLabels[props.status]
  return <span
    class={`feature-status${props.compact === true ? ' feature-status--compact' : ''}`}
    data-status={props.status}
    {...(props.compact === true ? { title: label } : {})}
  >
    <span aria-hidden="true" class="status-dot"/>
    <span class={props.compact === true ? 'sr-only' : 'status-label'}>{label}</span>
  </span>
}
