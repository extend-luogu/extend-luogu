import { describe, expect, it, vi } from 'vitest'
import { createNavigationService } from '../src'

describe('NavigationService', () => {
  it('allows same-origin navigation and explicitly allowed external opens', () => {
    const navigate = vi.fn()
    const open = vi.fn()
    const service = createNavigationService({ origin: 'https://www.luogu.com.cn', navigate, open }, ['https://codeforces.com'])
    service.navigate('/problem/P1000')
    service.open('https://codeforces.com/contest/1')
    expect(navigate).toHaveBeenCalledWith('https://www.luogu.com.cn/problem/P1000')
    expect(open).toHaveBeenCalledWith('https://codeforces.com/contest/1')
  })

  it('rejects cross-origin navigation and executable protocols', () => {
    const service = createNavigationService({ origin: 'https://www.luogu.com.cn', navigate() {}, open() {} })
    expect(() => service.navigate('https://evil.test/')).toThrow()
    expect(() => service.open('javascript:alert(1)')).toThrow()
    expect(() => service.open('data:text/html,bad')).toThrow()
  })
})
