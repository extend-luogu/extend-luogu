import { describe, expect, it } from 'vitest'
import { parseLuoguRoute } from '../src'

describe('parseLuoguRoute', () => {
  it.each([
    ['https://www.luogu.com.cn/', 'home', undefined],
    ['https://www.luogu.com.cn/problem/P1000', 'problem', 'P1000'],
    ['https://www.luogu.com.cn/record/123', 'record', '123'],
    ['https://www.luogu.com.cn/discuss/456', 'discussion', '456'],
    ['https://www.luogu.com.cn/discuss/show/456', 'discussion', '456'],
    ['https://www.luogu.com.cn/user/789', 'user', '789'],
    ['https://www.luogu.com.cn/contest/12', 'contest', '12'],
    ['https://www.luogu.com.cn/training/34', 'training', '34'],
    ['https://www.luogu.com.cn/blog/example/post', 'blog', undefined],
    ['https://www.luogu.com.cn/chat', 'chat', undefined],
    ['https://www.luogu.com.cn/chat/conversation/123', 'chat', undefined],
    ['https://www.luogu.com.cn/chat?uid=123', 'chat', undefined],
  ])('parses %s as %s', (url, expectedKind, expectedId) => {
    const result = parseLuoguRoute(url)
    expect(result.kind).toBe(expectedKind)
    if (expectedId) expect(Object.values(result.params)).toContain(expectedId)
  })

  it('changes its key for pathname, search, and hash', () => {
    const base = 'https://www.luogu.com.cn/problem/P1000'
    const keys = [base, `${base}?page=2`, `${base}#answer`, `${base.replace('P1000', 'P1001')}`]
      .map(url => parseLuoguRoute(url).key)
    expect(new Set(keys).size).toBe(4)
  })
})
