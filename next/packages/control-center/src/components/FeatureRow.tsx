import type { JSX } from 'preact'
import { useState } from 'preact/hooks'
import type { FeatureMetadata, FeatureStatusSnapshot, KernelController } from '@exlg/runtime'
import { Icon } from '../icons'
import { capabilityLabels, categoryLabels, errorMessage } from '../labels'
import { FeatureStatus } from './FeatureStatus'

export function FeatureRow(props: {
  readonly feature: FeatureMetadata
  readonly status: FeatureStatusSnapshot
  readonly kernel: KernelController
  readonly onOpen: () => void
}): JSX.Element {
  const [pending, setPending] = useState(false)
  const [operationError, setOperationError] = useState<string>()
  const enabled = props.status.status !== 'disabled'

  const toggle = async (next: boolean): Promise<void> => {
    if (pending) return
    setPending(true)
    setOperationError(undefined)
    try { await props.kernel.setFeatureEnabled(props.feature.id, next) }
    catch (error) { setOperationError(errorMessage(error)) }
    finally { setPending(false) }
  }

  const retry = async (): Promise<void> => {
    if (pending) return
    setPending(true)
    setOperationError(undefined)
    try { await props.kernel.retryFeature(props.feature.id) }
    catch (error) { setOperationError(errorMessage(error)) }
    finally { setPending(false) }
  }

  return <article class="feature-row" data-status={props.status.status}>
    <div class="feature-row-main">
      <button class="feature-open" onClick={props.onOpen} type="button">
        <span class="feature-title-line">
          <FeatureStatus compact status={props.status.status}/>
          <strong>{props.feature.title}</strong>
        </span>
        <span class="feature-description">{props.feature.description}</span>
      </button>
      <button
        aria-label={`配置${props.feature.title}`}
        class="feature-detail-button"
        onClick={props.onOpen}
        type="button"
      >
        <Icon name="settings" size={15}/><span>设置</span>
      </button>
      <label class="switch-control feature-toggle">
        <span class="sr-only">{props.feature.title}开关</span>
        <input
          checked={enabled}
          disabled={pending}
          onChange={event => void toggle(event.currentTarget.checked)}
          role="switch"
          type="checkbox"
        />
        <span aria-hidden="true" class="switch-track"/>
      </label>
    </div>
    <div class="feature-meta">
      <span>{categoryLabels[props.feature.category] ?? props.feature.category}</span>
      {props.feature.capabilities.length > 0
        ? <span aria-label="使用的能力" class="feature-capabilities">
            {props.feature.capabilities.map(capability =>
              <span class="capability-badge" key={capability}>{capabilityLabels[capability]}</span>,
            )}
          </span>
        : <span>无额外能力</span>}
      <span>{Object.keys(props.feature.settings).length} 项设置</span>
      <code>{props.feature.id}</code>
    </div>
    {props.status.status === 'error' && <div class="row-error-actions">
      <span class="inline-error">{props.status.lastError ?? '未知错误'}</span>
      <button class="text-button" disabled={pending} onClick={() => void retry()} type="button">
        <Icon name="retry"/>重试
      </button>
    </div>}
    {operationError && <span aria-live="polite" class="inline-error">操作失败：{operationError}</span>}
  </article>
}
