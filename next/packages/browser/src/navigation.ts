import type { NavigationService } from '@exlg/runtime'

export interface NavigationPlatform {
  readonly origin: string
  navigate(url: string): void
  open(url: string): void
}

function safeUrl(value: string, origin: string): URL {
  let url: URL
  try { url = new URL(value, origin) }
  catch { throw new TypeError('Navigation target is invalid') }
  if (!['http:', 'https:'].includes(url.protocol)) throw new TypeError('Navigation protocol is not allowed')
  return url
}

export function createNavigationService(
  platform: NavigationPlatform,
  allowedExternalOrigins: readonly string[] = [],
): NavigationService {
  const origin = new URL(platform.origin).origin
  const external = new Set(allowedExternalOrigins.map(item => new URL(item).origin))
  return {
    navigate(value) {
      const url = safeUrl(value, origin)
      if (url.origin !== origin) throw new TypeError('Cross-origin navigation is not allowed')
      platform.navigate(url.href)
    },
    open(value) {
      const url = safeUrl(value, origin)
      if (url.origin !== origin && !external.has(url.origin)) {
        throw new TypeError('External navigation target is not allowed')
      }
      platform.open(url.href)
    },
  }
}

export function createWindowNavigationPlatform(target: Window): NavigationPlatform {
  return {
    origin: target.location.origin,
    navigate: url => { target.location.assign(url) },
    open: url => {
      const opened = target.open(url, '_blank', 'noopener,noreferrer')
      if (opened) opened.opener = null
    },
  }
}
