import { render } from 'preact'
import type { Cleanup } from '@exlg/runtime'
import { ControlCenterApp } from './app/ControlCenterApp'
import { ControlCenterStore } from './store'
import type { MountControlCenterOptions } from './types'
import styles from './styles/index.css?raw'

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Mounts the host-owned, non-disableable ExLG Next system application. */
export function mountControlCenter(options: MountControlCenterOptions): Cleanup {
  const host = options.document.createElement('div')
  host.id = 'exlg-next-control-center-host'
  const shadow = host.attachShadow({ mode: 'open' })
  const style = options.document.createElement('style')
  style.textContent = styles
  const root = options.document.createElement('div')
  root.className = 'control-center-root'
  shadow.append(style, root)

  const store = new ControlCenterStore({
    kernel: options.kernel,
    routeSource: options.routeSource,
    preferences: options.preferences,
  })
  const applyHostState = (): void => {
    const snapshot = store.getSnapshot()
    host.dataset.theme = snapshot.preferences.theme
    host.dataset.density = snapshot.preferences.density
    host.dataset.side = snapshot.preferences.launcherSide
  }
  const unsubscribeHost = store.subscribe(applyHostState)
  applyHostState()
  render(<ControlCenterApp options={options} store={store}/>, root)
  void store.start()

  const attach = (): void => {
    const target = options.document.body ?? options.document.documentElement
    if (target && !host.isConnected) target.append(host)
  }
  attach()
  options.document.addEventListener('DOMContentLoaded', attach, { once: true })

  const onKeyDown = (event: KeyboardEvent): void => {
    const snapshot = store.getSnapshot()
    if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey
      && event.key.toLocaleLowerCase() === 'e') {
      event.preventDefault()
      store.toggle()
      return
    }
    if (!snapshot.open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      store.close()
      return
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault()
      store.showFeatureSearch()
      return
    }
    if (event.key !== 'Tab') return
    const panel = shadow.querySelector<HTMLElement>('.panel')
    if (!panel) return
    const focusable = [...panel.querySelectorAll<HTMLElement>(focusableSelector)]
      .filter(element => element.getAttribute('aria-hidden') !== 'true')
    if (focusable.length === 0) {
      event.preventDefault()
      panel.focus()
      return
    }
    const active = shadow.activeElement
    const first = focusable[0]!
    const last = focusable.at(-1)!
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault()
      last.focus()
    }
    else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }
  options.document.addEventListener('keydown', onKeyDown)

  let disposed = false
  return async () => {
    if (disposed) return
    disposed = true
    options.document.removeEventListener('DOMContentLoaded', attach)
    options.document.removeEventListener('keydown', onKeyDown)
    unsubscribeHost()
    await store.dispose()
    render(null, root)
    host.remove()
  }
}
