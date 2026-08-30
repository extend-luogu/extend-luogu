import type { Cleanup, RouteKind, RouteSnapshot, RouteSource } from '@exlg/runtime'

export const HISTORY_CHANGE_EVENT = 'exlg:vnext:history-change'

const routePatterns: readonly [RouteKind, RegExp, string][] = [
  ['chat', /^\/chat(?:\/.*)?$/, ''],
  ['problem', /^\/problem\/([^/]+)/, 'problemId'],
  ['record', /^\/record\/([^/]+)/, 'recordId'],
  ['discussion', /^\/discuss(?:\/show)?\/([^/]+)/, 'discussionId'],
  ['discussion', /^\/discuss(?:\/lists)?\/?$/, ''],
  ['user', /^\/user\/([^/]+)/, 'userId'],
  ['contest', /^\/contest\/([^/]+)/, 'contestId'],
  ['training', /^\/training\/([^/]+)/, 'trainingId'],
  ['blog', /^\/blog(?:\/.*)?$/, ''],
]

export function parseLuoguRoute(input: URL | string): RouteSnapshot {
  const url = input instanceof URL ? new URL(input.href) : new URL(input)
  if (url.pathname === '/') {
    return { kind: 'home', key: routeKey(url), url, params: {} }
  }
  for (const [kind, pattern, parameter] of routePatterns) {
    const match = pattern.exec(url.pathname)
    if (!match) continue
    const params: Record<string, string> = {}
    if (parameter && match[1]) params[parameter] = decodeURIComponent(match[1])
    return { kind, key: routeKey(url), url, params }
  }
  return { kind: 'unknown', key: routeKey(url), url, params: {} }
}

function routeKey(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`
}

export class LuoguRouteSource implements RouteSource {
  readonly #window: Window

  constructor(window: Window) {
    this.#window = window
  }

  current(): RouteSnapshot {
    return parseLuoguRoute(this.#window.location.href)
  }

  subscribe(listener: (route: RouteSnapshot) => void): Cleanup {
    const accept = (): void => listener(this.current())
    this.#window.addEventListener('popstate', accept)
    this.#window.addEventListener('hashchange', accept)
    this.#window.addEventListener(HISTORY_CHANGE_EVENT, accept)
    return () => {
      this.#window.removeEventListener('popstate', accept)
      this.#window.removeEventListener('hashchange', accept)
      this.#window.removeEventListener(HISTORY_CHANGE_EVENT, accept)
    }
  }
}
