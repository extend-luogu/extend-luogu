import { createNativeCrossTabPlatform } from '@exlg/browser'
import { createLuoguPrivateMessageService } from './private-messages'
import type { LuoguFeatureServices, TimerScheduler } from './private-messages'
import { createLuoguSessionService } from './session'

export function createLuoguFeatureServices(
  target: Window & typeof globalThis,
): LuoguFeatureServices {
  const timers: TimerScheduler = {
    setTimeout: (callback, delay) => target.setTimeout(callback, delay),
    clearTimeout: handle => target.clearTimeout(handle as number),
  }
  return {
    privateMessages: createLuoguPrivateMessageService({
      session: createLuoguSessionService(target),
      origin: target.location.origin,
      fetch: async (input, init) => target.fetch(input, init),
      webSocketFactory: url => new target.WebSocket(url),
      timers,
      crossTabPlatform: createNativeCrossTabPlatform(target),
      warn: message => target.console.warn(`[ExLG Next/Luogu] ${message}`),
      debug: message => target.console.debug(`[ExLG Next/Luogu] ${message}`),
    }),
  }
}
