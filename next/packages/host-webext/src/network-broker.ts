import type { NetworkBrokerResponse } from './network-protocol'
import { createNetworkBroker } from './network-broker-core'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

interface RuntimeApi {
  readonly runtime: {
    readonly onMessage: {
      addListener(listener: (
        message: unknown,
        sender: unknown,
        sendResponse: (response: NetworkBrokerResponse | { readonly ok: true }) => void,
      ) => boolean | undefined): void
    }
  }
}

function runtimeApi(): RuntimeApi {
  const globals = globalThis as typeof globalThis & { readonly browser?: RuntimeApi; readonly chrome?: RuntimeApi }
  const api = globals.browser ?? globals.chrome
  if (!api) throw new Error('WebExtension runtime API is unavailable')
  return api
}

const broker = createNetworkBroker()
runtimeApi().runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (isRecord(message) && message.type === 'exlg-network-cancel-v1' && typeof message.requestId === 'string') {
    broker.cancel(message.requestId)
    sendResponse({ ok: true })
    return undefined
  }
  if (!isRecord(message) || message.type !== 'exlg-network-request-v1') return undefined
  void broker.request(message).then(sendResponse)
  return true
})
