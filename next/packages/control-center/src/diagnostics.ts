import type { FeatureStatusSnapshot, RouteSnapshot } from '@exlg/runtime'
import type { ControlCenterEnvironment } from './types'

const urlWithSecrets = /\b(https?:\/\/[^\s?#]+)(?:\?[^\s#]*)?(?:#[^\s]*)?/gi

function removeControlCharacters(value: string): string {
  return [...value].filter(character => {
    const code = character.charCodeAt(0)
    return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)
  }).join('')
}

export function sanitizeDiagnosticText(value: string | undefined, limit = 300): string | undefined {
  if (value === undefined) return undefined
  const clean = removeControlCharacters(value)
    .replace(urlWithSecrets, '$1?[redacted]')
    .replace(/[\r\n]+/g, ' ')
    .trim()
  return clean.slice(0, limit)
}

export function createDiagnosticReport(options: {
  readonly environment: ControlCenterEnvironment
  readonly route: RouteSnapshot
  readonly statuses: readonly FeatureStatusSnapshot[]
}): string {
  const report = {
    appVersion: options.environment.version,
    host: options.environment.host,
    route: {
      kind: options.route.kind,
      pathname: options.route.url.pathname,
    },
    features: [...options.statuses]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(status => ({
        id: status.id,
        status: status.status,
        ...(status.lastError === undefined
          ? {}
          : { lastError: sanitizeDiagnosticText(status.lastError) }),
      })),
  }
  return JSON.stringify(report, null, 2)
}
