/** @vitest-environment jsdom */

import { fireEvent, render } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import type { JSX } from 'preact'
import { ErrorBoundary } from '../src/app/ErrorBoundary'

describe('Control Center ErrorBoundary', () => {
  it('contains view failures and reloads only the local UI', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const kernel = { unaffected: true }
    let shouldThrow = true
    function View(): JSX.Element {
      if (shouldThrow) throw new Error('local render failure')
      return <p>recovered locally</p>
    }
    const result = render(<ErrorBoundary
      onClose={() => undefined}
      onReload={() => { shouldThrow = false }}
    ><View/></ErrorBoundary>)
    expect(result.getByText('控制中心界面发生错误')).toBeTruthy()
    expect(kernel.unaffected).toBe(true)
    fireEvent.click(result.getByRole('button', { name: '重新加载控制中心 UI' }))
    expect(result.getByText('recovered locally')).toBeTruthy()
    expect(kernel.unaffected).toBe(true)
    consoleError.mockRestore()
  })
})
