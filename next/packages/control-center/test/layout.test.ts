import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(new URL('../src/styles/index.css', import.meta.url), 'utf8')

describe('Control Center shell layout', () => {
  it('keeps shell chrome fixed and delegates overflow to the view', () => {
    expect(styles).toMatch(/\.panel-header\s*\{[^}]*flex:\s*none/)
    expect(styles).toMatch(/\.navigation\s*\{[^}]*flex:\s*none/)
    expect(styles).toMatch(/\.view-container\s*\{[^}]*flex:\s*1 1 0/)
    expect(styles).toMatch(/\.view-container\s*\{[^}]*min-height:\s*0/)
    expect(styles).toMatch(/\.view-container\s*\{[^}]*overflow:\s*auto/)
  })
})
