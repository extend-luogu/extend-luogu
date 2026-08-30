import type { JSX } from 'preact'
import type { FeatureMetadata, FeatureStatusSnapshot, RouteSnapshot } from '@exlg/runtime'
import type { ControlCenterEnvironment } from '../types'
import { Icon } from '../icons'

export function OverviewView(props: {
  readonly catalog: readonly FeatureMetadata[]
  readonly statuses: ReadonlyMap<string, FeatureStatusSnapshot>
  readonly route: RouteSnapshot
  readonly environment: ControlCenterEnvironment
  readonly onShowFeatures: () => void
  readonly onShowFeature: (id: string) => void
}): JSX.Element {
  const statuses = [...props.statuses.values()]
  const enabled = statuses.filter(status => status.status !== 'disabled').length
  const mounted = statuses.filter(status => status.status === 'mounted').length
  const mounting = statuses.filter(status => status.status === 'mounting').length
  const errors = statuses.filter(status => status.status === 'error')
  return <div class="view overview-view">
    <header class="view-header">
      <div><span class="eyebrow">SYSTEM APP</span><h2>总览</h2></div>
      <span class="version-badge">v{props.environment.version}</span>
    </header>
    <section class="summary-strip" aria-label="运行摘要">
      <div><strong>{props.catalog.length}</strong><span>功能总数</span></div>
      <div><strong>{enabled}</strong><span>已启用</span></div>
      <div><strong>{mounted}</strong><span>运行中</span></div>
      <div><strong>{mounting}</strong><span>挂载中</span></div>
      <div data-alert={errors.length > 0}><strong>{errors.length}</strong><span>错误</span></div>
    </section>
    <section class="info-section">
      <h3>当前环境</h3>
      <dl class="definition-list">
        <div><dt>Host</dt><dd>{props.environment.host === 'userscript' ? 'UserScript' : 'Browser Extension'}</dd></div>
        <div><dt>路由类型</dt><dd>{props.route.kind}</dd></div>
        <div><dt>路径</dt><dd><code>{props.route.url.pathname}</code></dd></div>
      </dl>
    </section>
    <section class="info-section">
      <div class="section-heading"><h3>需要关注</h3><button class="text-button" onClick={props.onShowFeatures} type="button">查看全部功能</button></div>
      {errors.length === 0
        ? <p class="quiet-state"><Icon name="check"/>当前没有 Feature 错误。</p>
        : <ul class="attention-list">{errors.map(error => <li key={error.id}>
          <button onClick={() => props.onShowFeature(error.id)} type="button">
            <span>{props.catalog.find(feature => feature.id === error.id)?.title ?? error.id}</span>
            <small>{error.lastError ?? '未知错误'}</small>
          </button>
        </li>)}</ul>}
    </section>
  </div>
}
