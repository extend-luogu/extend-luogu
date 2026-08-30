import type { JSX } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type {
  FeatureMetadata,
  FeatureStatus,
  FeatureStatusSnapshot,
  KernelController,
} from '@exlg/runtime'
import { capabilityLabels, categoryLabels } from '../labels'
import { FeatureRow } from '../components/FeatureRow'
import { SearchField } from '../components/SearchField'

type StatusFilter = 'all' | 'enabled' | 'running' | 'idle' | 'error' | 'disabled'

const statusOrder: Record<FeatureStatus, number> = {
  error: 0,
  mounting: 1,
  mounted: 2,
  idle: 3,
  disabled: 4,
}

function searchableText(feature: FeatureMetadata): string {
  return [
    feature.title,
    feature.description,
    feature.id,
    feature.category,
    categoryLabels[feature.category] ?? feature.category,
    ...feature.capabilities.map(capability => capabilityLabels[capability]),
    ...Object.values(feature.settings).flatMap(setting => [setting.title, setting.description ?? '']),
  ].join('\n').toLocaleLowerCase()
}

function statusMatches(status: FeatureStatus, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'enabled') return status !== 'disabled'
  if (filter === 'running') return status === 'mounted' || status === 'mounting'
  return status === filter
}

export function FeaturesView(props: {
  readonly catalog: readonly FeatureMetadata[]
  readonly statuses: ReadonlyMap<string, FeatureStatusSnapshot>
  readonly kernel: KernelController
  readonly searchFocusRequest: number
  readonly onOpenFeature: (id: string) => void
}): JSX.Element {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (props.searchFocusRequest > 0) searchRef.current?.focus()
  }, [props.searchFocusRequest])

  const categories = useMemo(
    () => [...new Set(props.catalog.map(feature => feature.category))].sort(),
    [props.catalog],
  )
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return props.catalog.filter(feature => {
      const status = props.statuses.get(feature.id)?.status ?? 'disabled'
      return (category === 'all' || feature.category === category)
        && statusMatches(status, statusFilter)
        && (normalizedQuery === '' || searchableText(feature).includes(normalizedQuery))
    }).sort((left, right) => {
      const leftStatus = props.statuses.get(left.id)?.status ?? 'disabled'
      const rightStatus = props.statuses.get(right.id)?.status ?? 'disabled'
      return statusOrder[leftStatus] - statusOrder[rightStatus]
        || left.category.localeCompare(right.category)
        || left.title.localeCompare(right.title, 'zh-CN')
    })
  }, [category, props.catalog, props.statuses, query, statusFilter])

  return <div class="view features-view">
    <header class="view-header"><div><span class="eyebrow">CATALOG</span><h2>功能</h2></div><span>{filtered.length} / {props.catalog.length}</span></header>
    <SearchField inputRef={node => { searchRef.current = node }} onInput={setQuery} value={query}/>
    <div class="filter-row">
      <label><span>分类</span><select onChange={event => setCategory(event.currentTarget.value)} value={category}>
        <option value="all">全部分类</option>
        {categories.map(value => <option key={value} value={value}>{categoryLabels[value] ?? value}</option>)}
      </select></label>
      <label><span>状态</span><select onChange={event => setStatusFilter(event.currentTarget.value as StatusFilter)} value={statusFilter}>
        <option value="all">全部状态</option><option value="enabled">已启用</option>
        <option value="running">当前运行</option><option value="idle">当前页面未匹配</option>
        <option value="error">出错</option><option value="disabled">已关闭</option>
      </select></label>
    </div>
    <div class="feature-list">
      {filtered.length === 0 && <p class="empty-state">没有符合当前条件的功能。</p>}
      {filtered.map(feature => <FeatureRow
        feature={feature}
        kernel={props.kernel}
        key={feature.id}
        onOpen={() => props.onOpenFeature(feature.id)}
        status={props.statuses.get(feature.id) ?? { id: feature.id, status: 'disabled' }}
      />)}
    </div>
  </div>
}
