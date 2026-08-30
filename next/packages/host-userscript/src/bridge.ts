import { installLuoguMainWorldBridge } from '@exlg/luogu'
import type { Cleanup } from '@exlg/runtime'

export function installUserscriptHistoryBridge(): Cleanup {
  return installLuoguMainWorldBridge(unsafeWindow)
}
