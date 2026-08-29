import { installHistoryBridge } from '@exlg/luogu'

export function bootstrapMainWorldBridge(): void {
  installHistoryBridge(window)
}
