export interface NavigationIntent {
  readonly label: string
  readonly path: string
}

export function normalizeProblemId(input: string, optimistic = true): string | null {
  const text = input.trim().toUpperCase()
  if (/^(?:P[1-9]\d{3,}|CF[1-9]\d*[A-Z]\d?|AT_[A-Z0-9_]+|UVA[1-9]\d{2,}|SP[1-9]\d*|U[1-9]\d*|B[2-9]\d{3,}|T[1-9]\d*)$/.test(text)) return text
  if (/^[1-9]\d+[A-Z]\d?$/.test(text)) return `CF${text}`
  const atcoder = text.match(/^(ABC|ARC|AGC)(\d{3})_?([A-Z]\d?)$/)
  if (atcoder) {
    const [, family, rawContest, rawProblem] = atcoder
    if (!family || !rawContest || !rawProblem) return null
    const contest = Number(rawContest)
    let problem = rawProblem.toLowerCase()
    if (!text.includes('_') && family === 'ARC' && contest >= 58 && contest <= 103) {
      problem = String.fromCharCode(problem.charCodeAt(0) - 2) + problem.slice(1)
    }
    return `AT_${family.toLowerCase()}${rawContest}_${problem}`.toUpperCase()
  }
  if (optimistic && /^[1-9]\d{3,}$/.test(text)) return `P${text}`
  return null
}

const fixed: readonly NavigationIntent[] = [
  { label: '首页', path: '/' }, { label: '题库', path: '/problem/list' },
  { label: '比赛列表', path: '/contest/list' }, { label: '评测记录', path: '/record/list' },
  { label: '讨论列表', path: '/discuss/lists' }, { label: '私信', path: '/chat' },
  { label: '通知', path: '/user/notification' },
]

export function navigationIntents(query: string): readonly NavigationIntent[] {
  const trimmed = query.trim()
  if (!trimmed) return fixed
  const lower = trimmed.toLowerCase()
  const matchedFixed = fixed.filter(item => item.label.toLowerCase().includes(lower))
  const typed = trimmed.match(/^(?:用户|uid)\s*[:：]?\s*([1-9]\d*)$/i)
    ?? trimmed.match(/^(?:比赛|contest)\s*[:：]?\s*([1-9]\d*)$/i)
    ?? trimmed.match(/^(?:记录|record)\s*[:：]?\s*([1-9]\d*)$/i)
    ?? trimmed.match(/^(?:讨论|discussion)\s*[:：]?\s*([1-9]\d*)$/i)
  if (typed) {
    const kind = /^(?:用户|uid)/i.test(trimmed) ? 'user' : /^(?:比赛|contest)/i.test(trimmed) ? 'contest' : /^(?:记录|record)/i.test(trimmed) ? 'record' : 'discuss'
    return [{ label: `打开 ${kind} ${typed[1]}`, path: `/${kind}/${typed[1]}` }, ...matchedFixed]
  }
  const pid = normalizeProblemId(trimmed)
  return pid ? [{ label: `打开题目 ${pid}`, path: `/problem/${pid}` }, ...matchedFixed] : matchedFixed
}
