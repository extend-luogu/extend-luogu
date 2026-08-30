import type { JSX } from 'preact'
import { useRef, useState } from 'preact/hooks'
import type { FeatureMetadata, KernelController } from '@exlg/runtime'
import {
  applyConfigurationImport,
  createConfigurationExport,
  maximumConfigurationBytes,
  planConfigurationImport,
  stringifyConfiguration,
  validateConfiguration,
  type ConfigurationImportPlan,
} from '../config-format'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Icon } from '../icons'
import { errorMessage } from '../labels'
import type {
  ControlCenterEnvironment,
  FeatureConfigurationController,
} from '../types'

export function DataView(props: {
  readonly document: Document
  readonly catalog: readonly FeatureMetadata[]
  readonly kernel: KernelController
  readonly configuration: FeatureConfigurationController
  readonly environment: ControlCenterEnvironment
  readonly clipboard: { writeText(text: string): Promise<void> }
  readonly signal: AbortSignal
}): JSX.Element {
  const [source, setSource] = useState('')
  const [plan, setPlan] = useState<ConfigurationImportPlan>()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const operationGeneration = useRef(0)

  const exportText = async (): Promise<string> => stringifyConfiguration(await createConfigurationExport({
    catalog: props.catalog,
    kernel: props.kernel,
    configuration: props.configuration,
    environment: props.environment,
  }))

  const copy = async (): Promise<void> => {
    if (pending) return
    setPending(true)
    setError(undefined)
    try {
      const text = await exportText()
      if (props.signal.aborted) return
      await props.clipboard.writeText(text)
      if (props.signal.aborted) return
      setMessage('配置 JSON 已复制。')
    }
    catch (cause) { setError(errorMessage(cause)) }
    finally { setPending(false) }
  }

  const download = async (): Promise<void> => {
    if (pending) return
    setPending(true)
    setError(undefined)
    try {
      const view = props.document.defaultView
      if (!view?.URL.createObjectURL) throw new Error('当前环境不支持本地文件下载')
      const text = await exportText()
      if (props.signal.aborted) return
      const blob = new view.Blob([text], { type: 'application/json' })
      const url = view.URL.createObjectURL(blob)
      try {
        const anchor = props.document.createElement('a')
        anchor.download = 'exlg-next-configuration.json'
        anchor.href = url
        anchor.click()
      }
      finally { view.URL.revokeObjectURL(url) }
      setMessage('配置文件已生成。')
    }
    catch (cause) { setError(errorMessage(cause)) }
    finally { setPending(false) }
  }

  const preview = async (text: string): Promise<void> => {
    if (pending) return
    const generation = ++operationGeneration.current
    setPending(true)
    setError(undefined)
    setMessage(undefined)
    setPlan(undefined)
    try {
      const validated = validateConfiguration(text, props.catalog)
      const current = await createConfigurationExport({
        catalog: props.catalog,
        kernel: props.kernel,
        configuration: props.configuration,
        environment: props.environment,
      })
      if (!props.signal.aborted && generation === operationGeneration.current) {
        setPlan(planConfigurationImport(validated, current))
      }
    }
    catch (cause) {
      if (!props.signal.aborted && generation === operationGeneration.current) setError(errorMessage(cause))
    }
    finally {
      if (!props.signal.aborted && generation === operationGeneration.current) setPending(false)
    }
  }

  const readFile = async (file: File | undefined): Promise<void> => {
    if (!file) return
    if (file.size > maximumConfigurationBytes) {
      setError('配置文件超过 1 MiB 限制')
      return
    }
    try {
      const text = await file.text()
      setSource(text)
      await preview(text)
    }
    catch (cause) { setError(errorMessage(cause)) }
  }

  const apply = (): void => {
    if (!plan || pending) return
    setPending(true)
    setError(undefined)
    void applyConfigurationImport({
      plan,
      catalog: props.catalog,
      kernel: props.kernel,
      configuration: props.configuration,
    }).then(result => {
      if (props.signal.aborted) return
      setMessage(result.failedFeatures.length === 0
        ? `已应用 ${result.appliedFeatures} 个功能的配置。`
        : `已应用 ${result.appliedFeatures} 个功能，${result.failedFeatures.length} 个失败：${result.failedFeatures.map(item => item.id).join('、')}`)
      setPlan(undefined)
    }).catch(cause => {
      if (!props.signal.aborted) setError(errorMessage(cause))
    }).finally(() => {
      if (!props.signal.aborted) setPending(false)
    })
  }

  return <div class="view data-view">
    <header class="view-header"><div><span class="eyebrow">PORTABLE SETTINGS</span><h2>数据</h2></div></header>
    <section class="info-section">
      <h3>导出配置</h3>
      <p>只包含 Feature 启用状态和声明式设置；不包含题目笔记、私信、业务数据或控制中心偏好。</p>
      <div class="button-row">
        <button class="button" disabled={pending} onClick={() => void copy()} type="button"><Icon name="copy"/>复制 JSON</button>
        <button class="button secondary" disabled={pending} onClick={() => void download()} type="button"><Icon name="download"/>下载文件</button>
      </div>
    </section>
    <section class="info-section">
      <h3>导入配置</h3>
      <p>导入采用合并语义，未出现的功能保持不变。应用前必须预览并确认。</p>
      <label class="file-picker"><Icon name="upload"/><span>选择 JSON 文件</span><input accept="application/json,.json" disabled={pending} onChange={event => void readFile(event.currentTarget.files?.[0])} type="file"/></label>
      <label class="setting-column"><span class="setting-title">或粘贴 JSON（最大 1 MiB）</span>
        <textarea onInput={event => setSource(event.currentTarget.value)} rows={8} value={source}/>
      </label>
      <button class="button" disabled={pending || source.trim() === ''} onClick={() => void preview(source)} type="button">{pending ? '正在检查…' : '预览导入'}</button>
    </section>
    <div aria-live="polite" class="result-region">
      {message && <p class="success-box">{message}</p>}
      {error && <p class="error-box">{error}</p>}
    </div>
    {plan && <ConfirmDialog
      confirmLabel="应用配置"
      description={`将更新 ${plan.featureUpdates} 个功能、${plan.settingUpdates} 项设置，启用 ${plan.enableUpdates} 个、关闭 ${plan.disableUpdates} 个；忽略 ${plan.ignoredUnknownFeatures} 个未知功能和 ${plan.ignoredInvalidSettings} 个非法设置。`}
      onCancel={() => setPlan(undefined)}
      onConfirm={apply}
      pending={pending}
      title="确认应用导入配置？"
    />}
  </div>
}
