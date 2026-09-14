import { defineFeature } from '@exlg/runtime'

interface UserSearchResponse {
  readonly users?: unknown
}

interface NativeControlState {
  readonly element: HTMLElement
  readonly hidden: boolean
  readonly hadHiddenClass: boolean
}

interface JumpSwitcherBinding {
  readonly card: HTMLElement
  readonly heading: HTMLElement
  readonly nativeControls: readonly NativeControlState[]
  readonly nativeInput: HTMLInputElement
  readonly panel: HTMLElement
  readonly submit: HTMLButtonElement
  readonly originalTitle: string
  readonly toggle: HTMLButtonElement
  readonly userInput: HTMLInputElement
}

const hiddenClass = 'exlg-home-jump-hidden'
const idleSubmitText = '跳转到用户主页'

function positiveUid(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resultUid(data: UserSearchResponse, query: string): number | null {
  const users = Array.isArray(data.users) ? data.users : []
  const normalized = query.toLowerCase()
  const exact = users.find(user => (
    isRecord(user) && typeof user.name === 'string' && user.name.toLowerCase() === normalized
  ))
  return isRecord(exact) ? positiveUid(exact.uid) : null
}

function titleNode(heading: HTMLElement): ChildNode | null {
  return [...heading.childNodes].find(node => (
    node.nodeType === node.TEXT_NODE
    && (node.textContent?.includes('问题跳转') || node.textContent?.includes('查询用户'))
  )) ?? null
}

export default defineFeature({
  id: 'official.home-jump-switcher', apiVersion: 1,
  title: '首页用户跳转', description: '在首页的问题跳转与洛谷用户查询之间快速切换。',
  category: 'home', defaultEnabled: false, matches: route => route.kind === 'home',
  capabilities: ['dom', 'navigation', 'network.luogu', 'ui'], settings: {},
  mount(ctx) {
    let userMode = false
    const bindings = new Set<JumpSwitcherBinding>()

    ctx.dom.style(`
      .exlg-home-jump-toggle{appearance:none;background:transparent;border:0;color:#0e90d2;cursor:pointer;float:right;font:400 12px/1.6 system-ui;margin-top:.25em;padding:0}
      .exlg-home-jump-toggle:hover{text-decoration:underline}
      .exlg-home-jump-panel[hidden],.${hiddenClass}{display:none!important}
      .exlg-home-jump-panel>p{margin-bottom:0}
    `)

    const apply = (binding: JumpSwitcherBinding): void => {
      for (const control of binding.nativeControls) {
        control.element.hidden = userMode ? true : control.hidden
        control.element.classList.toggle(hiddenClass, userMode || control.hadHiddenClass)
      }
      binding.panel.hidden = !userMode
      binding.toggle.textContent = userMode ? '问题跳转' : '查询用户'
      binding.toggle.title = userMode ? '切换到问题跳转' : '切换到洛谷用户查询'
      binding.toggle.setAttribute('aria-pressed', String(userMode))
      const currentTitleNode = titleNode(binding.heading)
      if (currentTitleNode) {
        currentTitleNode.textContent = userMode
          ? binding.originalTitle.replace('问题跳转', '查询用户')
          : binding.originalTitle
      }
    }
    const applyAll = (): void => { for (const binding of bindings) apply(binding) }

    const install = (nativeInput: HTMLInputElement): void => {
      const card = nativeInput.closest<HTMLElement>('[data-problem-jump], .lg-index-stat')
      if (!card || card.querySelector('.exlg-home-jump-toggle')) return
      const heading = [...card.querySelectorAll<HTMLElement>('h1,h2,h3')]
        .find(element => element.textContent?.includes('问题跳转'))
      const nativeButton = card.querySelector<HTMLButtonElement>('button[name="goto"]')
      if (!heading || !nativeButton) return

      const inputContainer = nativeInput.closest<HTMLElement>('.am-input-group') ?? nativeInput
      const actionContainer = nativeButton.closest<HTMLElement>('p') ?? nativeButton.parentElement
      if (!actionContainer) return
      const controls = [inputContainer]
      if (actionContainer !== inputContainer) controls.push(actionContainer)
      const nativeControls = controls.map(element => ({
        element,
        hidden: element.hidden,
        hadHiddenClass: element.classList.contains(hiddenClass),
      }))

      const initialTitleNode = titleNode(heading)
      const originalTitle = initialTitleNode?.textContent ?? ''
      const originalMarker = card.getAttribute('data-problem-jump')
      card.setAttribute('data-problem-jump', '')

      const toggle = ctx.dom.create('button', {
        className: 'exlg-home-jump-toggle', text: '查询用户',
        attributes: { type: 'button', 'aria-label': '切换到洛谷用户查询', 'aria-pressed': 'false' },
      })
      const panel = ctx.dom.create('div', {
        className: 'exlg-home-jump-panel',
        attributes: { role: 'group', 'aria-label': '查询洛谷用户' },
      })
      panel.hidden = true
      const inputGroup = ctx.dom.create('div', { className: 'am-input-group am-input-group-primary am-input-group-sm' })
      const userInput = ctx.dom.create('input', {
        className: 'am-form-field',
        attributes: {
          type: 'text', name: 'exlg-user-jump', placeholder: '输入用户名或 UID',
          'aria-label': '洛谷用户名或 UID', autocomplete: 'off', maxlength: '32',
        },
      })
      const actions = ctx.dom.create('p')
      const submit = ctx.dom.create('button', {
        className: 'exlg-home-user-submit am-btn am-btn-primary am-btn-sm',
        text: idleSubmitText,
        attributes: { type: 'button' },
      })
      inputGroup.append(userInput)
      actions.append(submit)
      panel.append(inputGroup, actions)
      ctx.dom.mount(heading, toggle)
      ctx.dom.mount(card, panel)

      const binding: JumpSwitcherBinding = {
        card, heading, nativeControls, nativeInput, panel, submit, originalTitle, toggle, userInput,
      }
      bindings.add(binding)
      apply(binding)

      let pending = false
      const jumpToUser = async (): Promise<void> => {
        if (pending) return
        const query = userInput.value.trim()
        if (!query) {
          ctx.ui.toast({ message: '请输入洛谷用户名或 UID', tone: 'warning' })
          userInput.focus()
          return
        }

        if (/^\d+$/u.test(query)) {
          const uid = Number(query)
          if (!Number.isSafeInteger(uid) || uid <= 0) {
            ctx.ui.toast({ message: '请输入有效的 UID', tone: 'warning' })
            return
          }
          ctx.navigation.navigate(`/user/${uid}`)
          return
        }

        pending = true
        userInput.disabled = true
        submit.disabled = true
        submit.textContent = '查询中…'
        submit.setAttribute('aria-busy', 'true')
        try {
          const response = await ctx.network.request<UserSearchResponse>('luogu', {
            path: '/api/user/search', query: { keyword: query }, responseType: 'json', signal: ctx.signal,
          })
          const uid = resultUid(response.data, query)
          if (uid === null) {
            ctx.ui.toast({ message: '没有找到该洛谷用户', tone: 'warning' })
            return
          }
          ctx.navigation.navigate(`/user/${uid}`)
        }
        catch {
          if (!ctx.signal.aborted) ctx.ui.toast({ message: '用户查询暂时不可用', tone: 'error' })
        }
        finally {
          pending = false
          userInput.disabled = false
          submit.disabled = false
          submit.textContent = idleSubmitText
          submit.removeAttribute('aria-busy')
        }
      }

      ctx.dom.listen(toggle, 'click', () => {
        userMode = !userMode
        applyAll()
        if (userMode) userInput.focus()
        else nativeInput.focus()
      })
      ctx.dom.listen(submit, 'click', () => { void jumpToUser() })
      ctx.dom.listen(userInput, 'keydown', event => {
        const keyboard = event as KeyboardEvent
        if (keyboard.key !== 'Enter' || keyboard.isComposing) return
        keyboard.preventDefault()
        void jumpToUser()
      })
      ctx.scope.add(() => {
        bindings.delete(binding)
        const currentTitleNode = titleNode(heading)
        if (currentTitleNode) currentTitleNode.textContent = originalTitle
        if (originalMarker === null) card.removeAttribute('data-problem-jump')
        else card.setAttribute('data-problem-jump', originalMarker)
        for (const control of nativeControls) {
          control.element.hidden = control.hidden
          control.element.classList.toggle(hiddenClass, control.hadHiddenClass)
        }
      })
    }

    ctx.dom.observe<HTMLInputElement>(
      'input[name="toproblem"], [data-problem-jump] input[type="text"]',
      install,
    )
  },
})
