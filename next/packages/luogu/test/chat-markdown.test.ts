import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { createChatMarkdownRenderer } from '../src/chat-markdown'

async function render(source: string): Promise<HTMLDivElement> {
  const dom = new JSDOM('<body></body>', { url: 'https://www.luogu.com.cn/chat' })
  const root = dom.window.document.createElement('div')
  const renderer = await createChatMarkdownRenderer(dom.window.document, dom.window.location.origin)
  root.append(renderer.render(source))
  return root
}

describe('chat Markdown renderer', () => {
  it('renders Markdown, relative links and inline and block LaTeX', async () => {
    const root = await render('**粗体** [P1000](/problem/P1000) $x^2$\n\n$$\n\\sum_{i=1}^n i\n$$')
    expect(root.querySelector('strong')?.textContent).toBe('粗体')
    const link = root.querySelector('a')!
    expect(link.href).toBe('https://www.luogu.com.cn/problem/P1000')
    expect(link.target).toBe('_blank')
    expect(link.rel).toBe('noopener noreferrer')
    expect([...root.querySelectorAll('math annotation')].map(node => node.textContent)).toEqual(['x^2', '\\sum_{i=1}^n i'])
    expect(root.querySelector('math[display="block"]')).not.toBeNull()
  })

  it('removes executable markup and unsafe resource protocols', async () => {
    const root = await render('<script>globalThis.pwned = true</script>\n[bad](javascript:alert(1))\n<img src="data:text/html,test" onerror="alert(1)" alt="blocked">')
    expect(root.querySelector('script')).toBeNull()
    expect(root.querySelector('[onerror]')).toBeNull()
    expect(root.querySelector('a')?.hasAttribute('href')).toBe(false)
    expect(root.querySelector('img')).toBeNull()
    expect(root.textContent).toContain('blocked')
  })

  it('keeps malformed LaTeX readable and does not parse code spans as math', async () => {
    const root = await render('坏公式：$\\notACommand{$；代码：`$x$`')
    expect(root.textContent).toContain('\\notACommand')
    expect(root.querySelector('code')?.textContent).toBe('$x$')
    expect(root.querySelector('code math')).toBeNull()
  })

  it('falls back to plain text for unusually large messages', async () => {
    const source = `**not rendered**${'a'.repeat(20_000)}`
    const root = await render(source)
    expect(root.querySelector('strong')).toBeNull()
    expect(root.textContent).toBe(source)
  })
})
