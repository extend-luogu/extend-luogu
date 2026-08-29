import type {
  AnyFeatureDefinition,
  Cleanup,
  FeatureStatusSnapshot,
  KernelController,
  SettingDefinition,
} from '@exlg/runtime'

type SettingValue = string | boolean

export interface SettingsPanelData {
  getAll(feature: AnyFeatureDefinition): Promise<Readonly<Record<string, SettingValue>>>
  set(feature: AnyFeatureDefinition, name: string, value: SettingValue): Promise<void>
}

export interface SettingsPanelOptions {
  readonly document: Document
  readonly catalog: readonly AnyFeatureDefinition[]
  readonly kernel: KernelController
  readonly settings: SettingsPanelData
}

const styles = `
  :host { all: initial; color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  button, input, select { font: inherit; }
  .launcher {
    align-items: center; background: #2563eb; border: 0; border-radius: 999px;
    box-shadow: 0 5px 20px rgba(15, 23, 42, .24); color: white; cursor: pointer;
    display: flex; font: 700 13px/1 system-ui, sans-serif; height: 42px;
    justify-content: center; position: fixed; right: 18px; top: 76px; width: 42px;
    z-index: 2147483645;
  }
  .launcher:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
    outline: 3px solid #93c5fd; outline-offset: 2px;
  }
  .panel {
    background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px;
    box-shadow: 0 18px 60px rgba(15, 23, 42, .28); color: #172033;
    font: 13px/1.45 system-ui, sans-serif; max-height: min(720px, calc(100vh - 48px));
    overflow: auto; padding: 16px; position: fixed; right: 18px; top: 126px;
    width: min(390px, calc(100vw - 36px)); z-index: 2147483646;
  }
  .panel[hidden] { display: none; }
  .panel-header { align-items: center; display: flex; justify-content: space-between; }
  h2 { font-size: 17px; margin: 0; }
  .close, .retry {
    background: white; border: 1px solid #cbd5e1; border-radius: 5px; color: #334155;
    cursor: pointer; padding: 4px 8px;
  }
  .feature { background: white; border: 1px solid #dbe3ed; border-radius: 8px; margin-top: 12px; padding: 12px; }
  .feature-title { align-items: start; display: flex; gap: 10px; justify-content: space-between; }
  h3 { font-size: 14px; margin: 0; }
  p { color: #64748b; margin: 4px 0 0; }
  .meta { color: #64748b; display: flex; flex-wrap: wrap; font-size: 11px; gap: 7px; margin-top: 7px; }
  .status[data-status="error"] { color: #b91c1c; font-weight: 650; }
  .error { color: #b91c1c; font-size: 12px; margin-top: 7px; overflow-wrap: anywhere; }
  .settings { border-top: 1px solid #e2e8f0; display: grid; gap: 9px; margin-top: 10px; padding-top: 10px; }
  label { color: #334155; display: grid; gap: 4px; }
  input[type="text"], select { border: 1px solid #cbd5e1; border-radius: 5px; color: #172033; padding: 6px; width: 100%; }
  .boolean { align-items: center; display: flex; gap: 7px; }
  .actions { display: flex; justify-content: flex-end; margin-top: 7px; }
`

const statusLabels: Record<FeatureStatusSnapshot['status'], string> = {
  disabled: '已关闭',
  idle: '等待匹配页面',
  mounting: '正在挂载',
  mounted: '已挂载',
  error: '发生错误',
}

export function mountSettingsPanel(options: SettingsPanelOptions): Cleanup {
  const host = options.document.createElement('div')
  host.id = 'exlg-next-settings-host'
  const shadow = host.attachShadow({ mode: 'open' })
  const style = options.document.createElement('style')
  style.textContent = styles
  shadow.append(style)

  const launcher = element(options.document, 'button', 'launcher', 'Ex')
  launcher.type = 'button'
  launcher.setAttribute('aria-label', '打开 ExLG Next 设置')
  launcher.setAttribute('aria-expanded', 'false')
  const panel = element(options.document, 'section', 'panel')
  panel.hidden = true
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'ExLG Next 设置')
  const header = element(options.document, 'div', 'panel-header')
  header.append(element(options.document, 'h2', '', 'ExLG Next'))
  const close = element(options.document, 'button', 'close', '关闭')
  close.type = 'button'
  header.append(close)
  panel.append(header)
  shadow.append(launcher, panel)

  const statusElements = new Map<string, HTMLElement>()
  const errorElements = new Map<string, HTMLElement>()
  const retryButtons = new Map<string, HTMLButtonElement>()
  const enableInputs = new Map<string, HTMLInputElement>()

  for (const feature of options.catalog) {
    const card = element(options.document, 'article', 'feature')
    const titleRow = element(options.document, 'div', 'feature-title')
    const titleGroup = options.document.createElement('div')
    titleGroup.append(
      element(options.document, 'h3', '', feature.title),
      element(options.document, 'p', '', feature.description),
    )
    const enabled = options.document.createElement('input')
    enabled.type = 'checkbox'
    enabled.setAttribute('aria-label', `${feature.title} 开关`)
    enableInputs.set(feature.id, enabled)
    enabled.addEventListener('change', () => {
      enabled.disabled = true
      void options.kernel.setFeatureEnabled(feature.id, enabled.checked)
        .catch(error => showTransientError(errorElements.get(feature.id), error))
        .finally(() => { enabled.disabled = false })
    })
    titleRow.append(titleGroup, enabled)
    card.append(titleRow)

    const meta = element(options.document, 'div', 'meta')
    const status = element(options.document, 'span', 'status', '尚未启动')
    statusElements.set(feature.id, status)
    meta.append(status)
    if (feature.capabilities.length > 0) {
      meta.append(element(options.document, 'span', '', `能力：${feature.capabilities.join('、')}`))
    }
    card.append(meta)

    const error = element(options.document, 'div', 'error')
    error.hidden = true
    errorElements.set(feature.id, error)
    card.append(error)

    const settingsContainer = element(options.document, 'div', 'settings')
    settingsContainer.hidden = Object.keys(feature.settings).length === 0
    card.append(settingsContainer)
    void renderSettings(options, feature, settingsContainer)

    const actions = element(options.document, 'div', 'actions')
    const retry = element(options.document, 'button', 'retry', '重试')
    retry.type = 'button'
    retry.hidden = true
    retry.addEventListener('click', () => void options.kernel.retryFeature(feature.id))
    retryButtons.set(feature.id, retry)
    actions.append(retry)
    card.append(actions)
    panel.append(card)
  }

  const setOpen = (open: boolean): void => {
    panel.hidden = !open
    launcher.setAttribute('aria-expanded', String(open))
    if (open) close.focus()
    else launcher.focus()
  }
  launcher.addEventListener('click', () => setOpen(panel.hidden))
  close.addEventListener('click', () => setOpen(false))
  shadow.addEventListener('keydown', event => {
    if (event instanceof KeyboardEvent && event.key === 'Escape' && !panel.hidden) setOpen(false)
  })

  const unsubscribe = options.kernel.subscribeFeatureStatus(snapshot => {
    const status = statusElements.get(snapshot.id)
    if (status) {
      status.textContent = statusLabels[snapshot.status]
      status.dataset.status = snapshot.status
    }
    const enabled = enableInputs.get(snapshot.id)
    if (enabled) enabled.checked = snapshot.status !== 'disabled'
    const error = errorElements.get(snapshot.id)
    if (error) {
      error.textContent = snapshot.lastError ?? ''
      error.hidden = snapshot.status !== 'error'
    }
    const retry = retryButtons.get(snapshot.id)
    if (retry) retry.hidden = snapshot.status !== 'error'
  })

  const attach = (): void => {
    const target = options.document.body ?? options.document.documentElement
    if (target && !host.isConnected) target.append(host)
  }
  attach()
  options.document.addEventListener('DOMContentLoaded', attach, { once: true })

  return () => {
    unsubscribe()
    options.document.removeEventListener('DOMContentLoaded', attach)
    host.remove()
  }
}

async function renderSettings(
  options: SettingsPanelOptions,
  feature: AnyFeatureDefinition,
  container: HTMLElement,
): Promise<void> {
  try {
    const values = await options.settings.getAll(feature)
    for (const [name, definition] of Object.entries(feature.settings)) {
      const value = values[name] ?? definition.default
      container.append(settingControl(options, feature, name, definition, value))
    }
  }
  catch (error) {
    container.append(element(options.document, 'div', 'error', `设置读取失败：${message(error)}`))
  }
}

function settingControl(
  options: SettingsPanelOptions,
  feature: AnyFeatureDefinition,
  name: string,
  definition: SettingDefinition,
  value: SettingValue,
): HTMLElement {
  const label = options.document.createElement('label')
  const title = element(options.document, 'span', '', definition.title)
  const save = (next: SettingValue): void => {
    void options.settings.set(feature, name, next)
      .then(() => options.kernel.remountFeature(feature.id))
      .catch(error => showTransientError(label, error))
  }
  if (definition.kind === 'boolean') {
    label.className = 'boolean'
    const input = options.document.createElement('input')
    input.type = 'checkbox'
    input.checked = value === true
    input.addEventListener('change', () => save(input.checked))
    label.append(input, title)
    return label
  }
  label.append(title)
  if (definition.kind === 'string') {
    const input = options.document.createElement('input')
    input.type = 'text'
    input.value = typeof value === 'string' ? value : definition.default
    input.addEventListener('change', () => save(input.value))
    label.append(input)
    return label
  }
  const select = options.document.createElement('select')
  for (const option of definition.options) {
    const element = options.document.createElement('option')
    element.value = option.value
    element.textContent = option.label
    select.append(element)
  }
  select.value = typeof value === 'string' ? value : definition.default
  select.addEventListener('change', () => save(select.value))
  label.append(select)
  return label
}

function element<Tag extends keyof HTMLElementTagNameMap>(
  document: Document,
  tag: Tag,
  className = '',
  text = '',
): HTMLElementTagNameMap[Tag] {
  const result = document.createElement(tag)
  result.className = className
  result.textContent = text
  return result
}

function showTransientError(target: HTMLElement | undefined, error: unknown): void {
  if (!target) return
  target.textContent = `操作失败：${message(error)}`
  target.hidden = false
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
