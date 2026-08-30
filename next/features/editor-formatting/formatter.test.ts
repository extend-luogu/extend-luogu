import { describe, expect, it } from 'vitest'
import { formatMarkdown } from './formatter'

const base = { spacingCjkLatin: true, spacingCjkNumber: true, spacingInlineMath: true, normalizeSpaces: false, normalizePunctuation: false }

describe('formatMarkdown', () => {
  it('adds low-risk prose spacing', () => {
    expect(formatMarkdown('中文ABC与123以及$x+1$公式', base)).toBe('中文 ABC 与 123 以及 $x+1$ 公式')
  })
  it('preserves code, URLs, links, tags and LaTeX commands', () => {
    const source = '`中文ABC` https://a.test/中文ABC [中文ABC](https://a.test/x) <span>中文ABC</span> \\frac{中文ABC}'
    expect(formatMarkdown(source, base)).toBe('`中文ABC` https://a.test/中文ABC [中文ABC](https://a.test/x) <span>中文 ABC</span> \\frac{中文ABC}')
  })
  it('spaces around inline math without rewriting formula contents', () => {
    expect(formatMarkdown('中文$中文A+1$结尾', base)).toBe('中文 $中文A+1$ 结尾')
    expect(formatMarkdown('中文$$中文A+1$$结尾', base)).toBe('中文$$中文A+1$$结尾')
  })
  it('preserves fenced code and line structure', () => {
    const source = '正文ABC\n```cpp\n中文ABC  1\n```\n尾部123'
    expect(formatMarkdown(source, base)).toBe('正文 ABC\n```cpp\n中文ABC  1\n```\n尾部 123')
  })
})
