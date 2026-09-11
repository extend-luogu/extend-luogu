import type { Cleanup } from '@exlg/runtime'
import { installEditorBridge } from './editor-bridge'
import { installHistoryBridge } from './history-bridge'
import { installSessionBridge } from './session'

export function installLuoguMainWorldBridge(target: Window & typeof globalThis): Cleanup {
  const cleanHistory = installHistoryBridge(target)
  const cleanSession = installSessionBridge(target)
  const cleanEditor = installEditorBridge(target)
  return () => {
    cleanEditor()
    cleanSession()
    cleanHistory()
  }
}
