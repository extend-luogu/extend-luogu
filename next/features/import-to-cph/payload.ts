import type { LuoguProblemDetails } from '@exlg/luogu'

export interface CphPayload {
  readonly batch: { readonly id: string; readonly size: number }
  readonly name: string
  readonly group: string
  readonly url: string
  readonly interactive: boolean
  readonly memoryLimit: number
  readonly timeLimit: number
  readonly tests: readonly { readonly input: string; readonly output: string }[]
  readonly input: { readonly type: 'stdin' }
  readonly output: { readonly type: 'stdout' }
  readonly language: { readonly java: { readonly mainClass: 'Main'; readonly taskClass: string } }
  readonly testType: 'single'
}

function clean(value: string, limit: number): string {
  return [...value].filter(character => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }).join('').slice(0, limit)
}

export function applyProblemTemplate(template: string, values: { readonly pid: string; readonly cid?: string; readonly title?: string }): string {
  return clean(template, 160).replaceAll('${pid}', values.pid).replaceAll('${cid}', values.cid ?? '').replaceAll('${title}', clean(values.title ?? '', 120)).slice(0, 180)
}

export function createCphPayload(problem: LuoguProblemDetails, options: {
  readonly origin: string
  readonly name: string
  readonly batchId: string
  readonly batchSize: number
}): CphPayload {
  return {
    batch: { id: clean(options.batchId, 80), size: options.batchSize }, name: clean(options.name, 180), group: 'Luogu',
    url: `${new URL(options.origin).origin}/problem/${encodeURIComponent(problem.pid)}`, interactive: false,
    memoryLimit: problem.memoryLimitMb ?? 0, timeLimit: problem.timeLimitMs ?? 0, tests: problem.samples ?? [],
    input: { type: 'stdin' }, output: { type: 'stdout' }, language: { java: { mainClass: 'Main', taskClass: problem.pid } }, testType: 'single',
  }
}
