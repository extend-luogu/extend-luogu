import { installHistoryBridge } from '@exlg/luogu'
import type { Cleanup } from '@exlg/runtime'

export function installUserscriptHistoryBridge(): Cleanup {
  return installHistoryBridge(unsafeWindow)
}
