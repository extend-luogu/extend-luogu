import { installLuoguMainWorldBridge } from '@exlg/luogu'

export function bootstrapMainWorldBridge(): void {
  installLuoguMainWorldBridge(window)
}
