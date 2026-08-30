import type { JSX } from 'preact'

export type IconName =
  | 'home' | 'features' | 'database' | 'diagnostics' | 'settings'
  | 'search' | 'close' | 'back' | 'retry' | 'copy' | 'download'
  | 'upload' | 'warning' | 'check'

const paths: Record<IconName, JSX.Element> = {
  home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/></>,
  features: <><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></>,
  diagnostics: <><path d="M4 19h16M6 16l3-4 3 2 5-7 2 3"/><circle cx="17" cy="7" r="1"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34A1.7 1.7 0 0 0 14 20.93V21h-4v-.07a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.04A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10 3.01V3h4v.01a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v4h-.04A1.7 1.7 0 0 0 19.4 15z"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  back: <path d="m15 5-7 7 7 7"/>,
  retry: <><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="1"/><path d="M16 8V5H5v11h3"/></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M5 20h14"/></>,
  upload: <><path d="M12 16V4m-4 4 4-4 4 4"/><path d="M5 20h14"/></>,
  warning: <><path d="M12 3 2.5 20h19z"/><path d="M12 9v5m0 3h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
}

export function Icon(props: { readonly name: IconName; readonly size?: number }): JSX.Element {
  const size = props.size ?? 18
  return <svg
    aria-hidden="true"
    class="icon"
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="1.8"
  >{paths[props.name]}</svg>
}
