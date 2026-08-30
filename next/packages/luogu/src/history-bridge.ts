import type { Cleanup } from '@exlg/runtime'
import { HISTORY_CHANGE_EVENT } from './routes'

type HistoryMethod = History['pushState']

export function installHistoryBridge(target: Window & typeof globalThis): Cleanup {
  const { history } = target
  const originalPush = history.pushState
  const originalReplace = history.replaceState

  const wrap = (original: HistoryMethod): HistoryMethod => function wrapped(
    this: History,
    data: unknown,
    unused: string,
    url?: string | URL | null,
  ): void {
    original.call(this, data, unused, url)
    target.dispatchEvent(new target.CustomEvent(HISTORY_CHANGE_EVENT))
  }

  const push = wrap(originalPush)
  const replace = wrap(originalReplace)
  history.pushState = push
  history.replaceState = replace

  return () => {
    if (history.pushState === push) history.pushState = originalPush
    if (history.replaceState === replace) history.replaceState = originalReplace
  }
}
