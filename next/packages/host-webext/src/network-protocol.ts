import type { NetworkTarget } from '@exlg/runtime'

export type ExternalNetworkTarget = Exclude<NetworkTarget, 'luogu'>

export interface NetworkBrokerRequestMessage {
  readonly type: 'exlg-network-request-v1'
  readonly requestId: string
  readonly request: {
    readonly target: ExternalNetworkTarget
    readonly path: string
    readonly method: 'GET' | 'POST'
    readonly query: Readonly<Record<string, string>>
    readonly headers: Readonly<Record<string, string>>
    readonly body?: string
    readonly timeoutMs: number
  }
}

export interface NetworkBrokerCancelMessage {
  readonly type: 'exlg-network-cancel-v1'
  readonly requestId: string
}

export type NetworkBrokerMessage = NetworkBrokerRequestMessage | NetworkBrokerCancelMessage

export type NetworkBrokerResponse =
  | {
      readonly type: 'exlg-network-response-v1'
      readonly requestId: string
      readonly ok: true
      readonly status: number
      readonly body: string
      readonly finalUrl: string
    }
  | {
      readonly type: 'exlg-network-response-v1'
      readonly requestId: string
      readonly ok: false
      readonly error: 'invalid-request' | 'timeout' | 'aborted' | 'transport' | 'redirect' | 'response-too-large'
    }

export function isNetworkBrokerResponse(value: unknown): value is NetworkBrokerResponse {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  if (candidate.type !== 'exlg-network-response-v1'
    || typeof candidate.requestId !== 'string'
    || typeof candidate.ok !== 'boolean') return false
  if (candidate.ok) {
    return Number.isInteger(candidate.status)
      && typeof candidate.body === 'string'
      && typeof candidate.finalUrl === 'string'
  }
  return ['invalid-request', 'timeout', 'aborted', 'transport', 'redirect', 'response-too-large']
    .includes(String(candidate.error))
}
