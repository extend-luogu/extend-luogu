import { defineFeature } from '@exlg/runtime'
import { createChatMarkdownRenderer, type ChatMarkdownRenderer } from '@exlg/luogu'
import styles from './styles.css?inline'

const renderedClass = 'exlg-chat-markdown'
const contentClass = 'exlg-chat-markdown-content'

export default defineFeature({
  id: 'official.chat-markdown',
  apiVersion: 1,
  title: '私信 Markdown/LaTeX',
  description: '在洛谷私信气泡中安全渲染 Markdown 与 LaTeX。',
  category: 'communication',
  defaultEnabled: false,
  matches: route => route.kind === 'chat',
  capabilities: ['dom'],
  settings: {},
  mount(ctx) {
    const rendered = new WeakSet<HTMLElement>()
    let renderer: Promise<ChatMarkdownRenderer> | undefined
    ctx.dom.style(styles)

    const render = async (message: HTMLElement): Promise<void> => {
      if (rendered.has(message) || message.closest(`.${contentClass}`) !== null) return
      rendered.add(message)

      try {
        renderer ??= createChatMarkdownRenderer(message.ownerDocument, ctx.route.url.origin)
        const activeRenderer = await renderer
        if (ctx.signal.aborted || !message.isConnected) return

        const source = message.textContent ?? ''
        const originalNodes = message.ownerDocument.createDocumentFragment()
        const content = ctx.dom.create('div', { className: contentClass })
        content.append(activeRenderer.render(source))

        originalNodes.append(...message.childNodes)
        message.classList.add(renderedClass)
        message.append(content)

        ctx.scope.add(() => {
          if (content.parentElement === message) message.replaceChildren(originalNodes)
          message.classList.remove(renderedClass)
        })
      }
      catch (error) {
        rendered.delete(message)
        ctx.log.warn('私信 Markdown/LaTeX 渲染失败', error)
      }
    }

    ctx.dom.observe<HTMLElement>('.message', message => {
      void render(message)
    })
  },
})
