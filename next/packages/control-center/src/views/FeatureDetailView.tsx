import type { JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { FeatureMetadata, FeatureStatusSnapshot, KernelController } from '@exlg/runtime'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FeatureStatus } from '../components/FeatureStatus'
import { SettingControl } from '../components/SettingControl'
import { Icon } from '../icons'
import { capabilityLabels, categoryLabels, errorMessage } from '../labels'
import type { FeatureConfigurationController, SettingValue } from '../types'

export function FeatureDetailView(props: {
  readonly feature: FeatureMetadata
  readonly status: FeatureStatusSnapshot
  readonly kernel: KernelController
  readonly configuration: FeatureConfigurationController
  readonly signal: AbortSignal
  readonly onBack: () => void
}): JSX.Element {
  const [values, setValues] = useState<Readonly<Record<string, SettingValue>>>()
  const [loadError, setLoadError] = useState<string>()
  const [pending, setPending] = useState<Readonly<Record<string, boolean>>>({})
  const [settingErrors, setSettingErrors] = useState<Readonly<Record<string, string>>>({})
  const [togglePending, setTogglePending] = useState(false)
  const [toggleError, setToggleError] = useState<string>()
  const [systemPending, setSystemPending] = useState(false)
  const [systemError, setSystemError] = useState<string>()
  const [confirmReset, setConfirmReset] = useState(false)
  const [reloadGeneration, setReloadGeneration] = useState(0)
  const loadGeneration = useRef(0)
  const saveGenerations = useRef(new Map<string, number>())

  useEffect(() => {
    const generation = ++loadGeneration.current
    setValues(undefined)
    setLoadError(undefined)
    void props.configuration.getAll(props.feature).then(result => {
      if (!props.signal.aborted && generation === loadGeneration.current) setValues(result)
    }).catch(error => {
      if (!props.signal.aborted && generation === loadGeneration.current) setLoadError(errorMessage(error))
    })
    return () => { loadGeneration.current += 1 }
  }, [props.configuration, props.feature, props.signal, reloadGeneration])

  const save = async (name: string, value: SettingValue): Promise<void> => {
    const generation = (saveGenerations.current.get(name) ?? 0) + 1
    saveGenerations.current.set(name, generation)
    setPending(current => ({ ...current, [name]: true }))
    setSettingErrors(current => {
      const next = { ...current }
      delete next[name]
      return next
    })
    setValues(current => current === undefined ? current : { ...current, [name]: value })
    try {
      await props.configuration.set(props.feature, name, value)
      if (props.status.status !== 'disabled') await props.kernel.remountFeature(props.feature.id)
    }
    catch (error) {
      if (saveGenerations.current.get(name) === generation) {
        setSettingErrors(current => ({ ...current, [name]: errorMessage(error) }))
        setReloadGeneration(current => current + 1)
      }
    }
    finally {
      if (saveGenerations.current.get(name) === generation) {
        setPending(current => ({ ...current, [name]: false }))
      }
    }
  }

  const systemOperation = async (operation: () => Promise<void>): Promise<void> => {
    if (systemPending) return
    setSystemPending(true)
    setSystemError(undefined)
    try { await operation() }
    catch (error) { setSystemError(errorMessage(error)) }
    finally { setSystemPending(false) }
  }

  const toggleEnabled = async (enabled: boolean): Promise<void> => {
    if (togglePending || systemPending) return
    setTogglePending(true)
    setToggleError(undefined)
    try { await props.kernel.setFeatureEnabled(props.feature.id, enabled) }
    catch (error) { setToggleError(errorMessage(error)) }
    finally { setTogglePending(false) }
  }

  const reset = (): void => {
    void systemOperation(async () => {
      await props.configuration.reset(props.feature)
      if (props.status.status !== 'disabled') await props.kernel.remountFeature(props.feature.id)
      setReloadGeneration(current => current + 1)
      setConfirmReset(false)
    })
  }

  return <div class="view feature-detail-view">
    <header class="detail-header">
      <button aria-label="返回功能列表" class="icon-button" onClick={props.onBack} type="button"><Icon name="back"/></button>
      <div><span class="eyebrow">FEATURE DETAIL</span><h2>{props.feature.title}</h2></div>
    </header>
    <p class="detail-description">{props.feature.description}</p>
    <section class="detail-summary">
      <div class="detail-status-row">
        <FeatureStatus status={props.status.status}/>
        <label class="detail-enable-control">
          <span>启用功能</span>
          <span class="switch-control">
            <input
              aria-label={`${props.feature.title}开关`}
              checked={props.status.status !== 'disabled'}
              disabled={togglePending || systemPending}
              onChange={event => void toggleEnabled(event.currentTarget.checked)}
              role="switch"
              type="checkbox"
            />
            <span aria-hidden="true" class="switch-track"/>
          </span>
        </label>
      </div>
      {toggleError && <p aria-live="polite" class="inline-error detail-toggle-error">启停失败：{toggleError}</p>}
      <dl class="definition-list">
        <div><dt>ID</dt><dd><code>{props.feature.id}</code></dd></div>
        <div><dt>分类</dt><dd>{categoryLabels[props.feature.category] ?? props.feature.category}</dd></div>
        <div><dt>API</dt><dd>v{props.feature.apiVersion}</dd></div>
        <div><dt>默认状态</dt><dd>{props.feature.defaultEnabled ? '启用' : '关闭'}</dd></div>
        <div><dt>当前 routeKey</dt><dd><code>{props.status.routeKey ?? '—'}</code></dd></div>
      </dl>
      <div class="capability-list" aria-label="能力">
        {props.feature.capabilities.map(capability =>
          <span class="capability-badge" key={capability}>{capabilityLabels[capability]}</span>,
        )}
      </div>
      {props.status.lastError && <p aria-live="polite" class="error-box">{props.status.lastError}</p>}
    </section>
    <section class="info-section">
      <h3>功能设置</h3>
      {loadError && <p class="error-box">设置读取失败：{loadError}</p>}
      {!values && !loadError && <p class="loading-state">正在读取设置…</p>}
      {values && Object.keys(props.feature.settings).length === 0 && <p class="empty-state">此功能没有可配置项。</p>}
      {values && <div class="settings-list">{Object.entries(props.feature.settings).map(([name, definition]) =>
        <SettingControl
          definition={definition}
          error={settingErrors[name]}
          key={name}
          name={name}
          onSave={value => save(name, value)}
          pending={pending[name] === true}
          value={values[name] ?? definition.default}
        />)}</div>}
    </section>
    <section class="info-section advanced-actions">
      <h3>系统操作</h3>
      <div class="button-row">
        {props.status.status === 'error' && <button class="button" disabled={systemPending || togglePending} onClick={() => void systemOperation(() => props.kernel.retryFeature(props.feature.id))} type="button"><Icon name="retry"/>重试</button>}
        <button class="button secondary" disabled={systemPending || togglePending || props.status.status === 'disabled'} onClick={() => void systemOperation(() => props.kernel.remountFeature(props.feature.id))} type="button">重新挂载</button>
        <button class="button danger-outline" disabled={systemPending || togglePending || Object.values(pending).some(Boolean)} onClick={() => setConfirmReset(true)} type="button">恢复本功能默认设置</button>
      </div>
      <p class="setting-description">恢复设置不会删除该功能的业务数据。</p>
      {systemError && <p aria-live="polite" class="inline-error">操作失败：{systemError}</p>}
    </section>
    {confirmReset && <ConfirmDialog
      confirmLabel="恢复默认设置"
      description="只删除本功能的设置命名空间；题目笔记等业务数据不会被删除。"
      onCancel={() => setConfirmReset(false)}
      onConfirm={reset}
      pending={systemPending}
      title={`恢复“${props.feature.title}”的默认设置？`}
    />}
  </div>
}
