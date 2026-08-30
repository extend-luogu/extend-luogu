import type { JSX } from 'preact'
import { useState } from 'preact/hooks'
import type { ControlCenterStore } from '../store'
import type { ControlCenterPreferences } from '../types'
import { errorMessage } from '../labels'

export function PreferencesView(props: {
  readonly store: ControlCenterStore
  readonly preferences: ControlCenterPreferences
}): JSX.Element {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<string>()

  const update = async (patch: Partial<ControlCenterPreferences>): Promise<void> => {
    setPending(true)
    setResult(undefined)
    try { await props.store.updatePreferences({ ...props.preferences, ...patch }) }
    catch (error) { setResult(`保存失败：${errorMessage(error)}`) }
    finally { setPending(false) }
  }

  const reset = async (): Promise<void> => {
    setPending(true)
    setResult(undefined)
    try {
      await props.store.resetPreferences()
      setResult('控制中心偏好已恢复默认。')
    }
    catch (error) { setResult(`恢复失败：${errorMessage(error)}`) }
    finally { setPending(false) }
  }

  return <div class="view preferences-view">
    <header class="view-header"><div><span class="eyebrow">CONTROL CENTER</span><h2>面板设置</h2></div></header>
    <section class="settings-list preference-settings">
      <label class="setting-row setting-column">
        <span class="setting-title">主题</span>
        <span class="setting-description">跟随系统时使用浏览器的颜色模式。</span>
        <select disabled={pending} onChange={event => void update({ theme: event.currentTarget.value as ControlCenterPreferences['theme'] })} value={props.preferences.theme}>
          <option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option>
        </select>
      </label>
      <label class="setting-row setting-column">
        <span class="setting-title">信息密度</span>
        <select disabled={pending} onChange={event => void update({ density: event.currentTarget.value as ControlCenterPreferences['density'] })} value={props.preferences.density}>
          <option value="comfortable">舒适</option><option value="compact">紧凑</option>
        </select>
      </label>
      <label class="setting-row setting-column">
        <span class="setting-title">Launcher 位置</span>
        <select disabled={pending} onChange={event => void update({ launcherSide: event.currentTarget.value as ControlCenterPreferences['launcherSide'] })} value={props.preferences.launcherSide}>
          <option value="right">右侧</option><option value="left">左侧</option>
        </select>
      </label>
    </section>
    <section class="info-section">
      <h3>快捷键</h3>
      <dl class="shortcut-list">
        <div><dt><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd></dt><dd>打开或关闭控制中心</dd></div>
        <div><dt><kbd>Esc</kbd></dt><dd>关闭控制中心</dd></div>
        <div><dt><kbd>Ctrl/Cmd</kbd> + <kbd>K</kbd></dt><dd>聚焦功能搜索</dd></div>
      </dl>
    </section>
    <section class="info-section">
      <h3>恢复默认</h3>
      <p>只重置控制中心主题、密度、位置和上次页面，不影响任何 Feature。</p>
      <button class="button danger-outline" disabled={pending} onClick={() => void reset()} type="button">恢复控制中心默认设置</button>
    </section>
    {result && <p aria-live="polite" class={result.startsWith('保存失败') || result.startsWith('恢复失败') ? 'error-box' : 'success-box'}>{result}</p>}
  </div>
}
