import type { JSX } from 'preact'

export function Launcher(props: {
  readonly open: boolean
  readonly onToggle: () => void
  readonly buttonRef: (node: HTMLButtonElement | null) => void
}): JSX.Element {
  return <button
    aria-expanded={props.open}
    aria-haspopup="dialog"
    aria-label={props.open ? '关闭 ExLG Next 控制中心' : '打开 ExLG Next 控制中心'}
    class="launcher"
    onClick={props.onToggle}
    ref={props.buttonRef}
    type="button"
  >
    <span class="launcher-mark">Ex</span>
    <span class="launcher-label">LG</span>
  </button>
}
