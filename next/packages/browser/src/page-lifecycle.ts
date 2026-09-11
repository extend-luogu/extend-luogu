import type { Cleanup } from '@exlg/runtime'

interface PageHideTarget {
  addEventListener(type: 'pagehide', listener: (event: PageTransitionEvent) => void): void
  removeEventListener(type: 'pagehide', listener: (event: PageTransitionEvent) => void): void
}

/** Keeps the current app alive while its document is stored in the back-forward cache. */
export function installPageExitCleanup(target: PageHideTarget, cleanup: () => void): Cleanup {
  const handlePageHide = (event: PageTransitionEvent): void => {
    if (!event.persisted) cleanup()
  }
  target.addEventListener('pagehide', handlePageHide)
  return () => target.removeEventListener('pagehide', handlePageHide)
}
