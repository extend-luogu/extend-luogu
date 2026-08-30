import { Component, type ComponentChildren } from 'preact'
import { sanitizeDiagnosticText } from '../diagnostics'
import { Icon } from '../icons'

interface Props {
  readonly children: ComponentChildren
  readonly onClose: () => void
  readonly onReload: () => void
}

interface State {
  readonly failed: boolean
  readonly message?: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(error: unknown): State {
    const message = sanitizeDiagnosticText(error instanceof Error ? error.message : String(error))
    return { failed: true, ...(message === undefined ? {} : { message }) }
  }

  componentDidCatch(error: unknown): void {
    console.error('[ExLG Next/Control Center] UI render failed:', sanitizeDiagnosticText(error instanceof Error ? error.message : String(error)))
  }

  render(): ComponentChildren {
    if (!this.state.failed) return this.props.children
    return <div class="open-layer">
      <button aria-label="关闭控制中心" class="backdrop" onClick={this.props.onClose} type="button"/>
      <section aria-modal="true" class="panel error-fallback" role="dialog">
        <Icon name="warning" size={28}/>
        <h2>控制中心界面发生错误</h2>
        <p>{this.state.message ?? '未知渲染错误'}</p>
        <div class="button-row">
          <button class="button" onClick={() => {
            this.setState({ failed: false })
            this.props.onReload()
          }} type="button">重新加载控制中心 UI</button>
          <button class="button secondary" onClick={this.props.onClose} type="button">关闭</button>
        </div>
      </section>
    </div>
  }
}
