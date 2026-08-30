import type { JSX } from 'preact'
import { useState } from 'preact/hooks'
import type { FeatureMetadata, FeatureStatusSnapshot, RouteSnapshot } from '@exlg/runtime'
import { createDiagnosticReport } from '../diagnostics'
import type { ObservedFeatureError } from '../store'
import type { ControlCenterEnvironment } from '../types'
import { FeatureStatus } from '../components/FeatureStatus'
import { Icon } from '../icons'
import { errorMessage } from '../labels'

export function DiagnosticsView(props: {
  readonly catalog: readonly FeatureMetadata[]
  readonly statuses: ReadonlyMap<string, FeatureStatusSnapshot>
  readonly errors: readonly ObservedFeatureError[]
  readonly route: RouteSnapshot
  readonly environment: ControlCenterEnvironment
  readonly clipboard: { writeText(text: string): Promise<void> }
}): JSX.Element {
  const [result, setResult] = useState<string>()
  const copy = async (): Promise<void> => {
    try {
      await props.clipboard.writeText(createDiagnosticReport({
        environment: props.environment,
        route: props.route,
        statuses: [...props.statuses.values()],
      }))
      setResult('诊断报告已复制。')
    }
    catch (error) { setResult(`复制失败：${errorMessage(error)}`) }
  }
  return <div class="view diagnostics-view">
    <header class="view-header"><div><span class="eyebrow">LOCAL DIAGNOSTICS</span><h2>诊断</h2></div>
      <button class="button secondary" onClick={() => void copy()} type="button"><Icon name="copy"/>复制诊断报告</button>
    </header>
    <dl class="definition-list environment-list">
      <div><dt>ExLG</dt><dd>v{props.environment.version}</dd></div>
      <div><dt>Host</dt><dd>{props.environment.host}</dd></div>
      <div><dt>Route</dt><dd>{props.route.kind}</dd></div>
      <div><dt>Path</dt><dd><code>{props.route.url.pathname}</code></dd></div>
    </dl>
    <section class="info-section">
      <h3>Feature 状态</h3>
      <div class="diagnostic-list">{props.catalog.map(feature => {
        const status = props.statuses.get(feature.id) ?? { id: feature.id, status: 'disabled' as const }
        return <article key={feature.id}>
          <div><strong>{feature.title}</strong><FeatureStatus status={status.status}/></div>
          <code>{feature.id}</code><code>{status.routeKey ?? '—'}</code>
          {status.lastError && <p>{status.lastError}</p>}
        </article>
      })}</div>
    </section>
    <section class="info-section">
      <h3>本次页面会话最近错误</h3>
      {props.errors.length === 0
        ? <p class="empty-state">尚未观察到错误。</p>
        : <ol class="error-history">{[...props.errors].reverse().map(item => <li key={item.sequence}>
          <code>{item.featureId}</code><span>{item.message}</span>
        </li>)}</ol>}
    </section>
    {result && <p aria-live="polite" class="success-box">{result}</p>}
  </div>
}
