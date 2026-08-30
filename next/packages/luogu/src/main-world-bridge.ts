import type { Cleanup } from '@exlg/runtime'
import { installHistoryBridge } from './history-bridge'
import { installSessionBridge } from './session'

export function installLuoguMainWorldBridge(target: Window & typeof globalThis): Cleanup {
  const cleanHistory = installHistoryBridge(target)
  const cleanSession = installSessionBridge(target)
  return () => {
    cleanSession()
    cleanHistory()
  }
}
