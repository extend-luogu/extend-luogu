import type { NetworkService } from '@exlg/runtime'
import type { LuoguSessionService } from './session'

export interface LuoguProblemSource {
  readonly type: 'luogu' | 'codeforces' | 'atcoder' | 'other'
  readonly remoteId?: string
  readonly url?: string
}

export interface LuoguProblemSummary {
  readonly pid: string
  readonly title?: string
  readonly difficulty?: number
  readonly source?: LuoguProblemSource
}

export interface LuoguProblemDetails extends LuoguProblemSummary {
  readonly samples?: readonly { readonly input: string; readonly output: string }[]
  readonly timeLimitMs?: number
  readonly memoryLimitMb?: number
}

export interface LuoguContestContext {
  readonly contestId: string
  readonly title?: string
  readonly problems: readonly LuoguProblemSummary[]
}

export type LuoguTrainingProblemStatus = 'new' | 'attempted' | 'accepted' | 'unknown'
export interface LuoguTrainingProblem {
  readonly problem: LuoguProblemSummary
  readonly status: LuoguTrainingProblemStatus
}
export interface LuoguTrainingContext {
  readonly trainingId: string
  readonly problems: readonly LuoguTrainingProblem[]
}

export interface LuoguRecordProblem {
  readonly pid: string
  readonly difficulty: number
}

export interface LuoguPageDataService {
  currentProblem(options?: { readonly signal?: AbortSignal }): Promise<LuoguProblemDetails | null>
  problem(pid: string, options?: { readonly signal?: AbortSignal }): Promise<LuoguProblemDetails | null>
  currentContest(options?: { readonly signal?: AbortSignal }): Promise<LuoguContestContext | null>
  contest(contestId: string, options?: { readonly signal?: AbortSignal }): Promise<LuoguContestContext | null>
  currentTraining(options?: { readonly signal?: AbortSignal }): Promise<LuoguTrainingContext | null>
  training(trainingId: string, options?: { readonly signal?: AbortSignal }): Promise<LuoguTrainingContext | null>
  visibleRecords(options?: { readonly signal?: AbortSignal }): Promise<readonly LuoguRecordProblem[]>
  acceptedProblemIds(options?: { readonly signal?: AbortSignal }): Promise<readonly string[] | null>
  currentUserId(): number | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function shortText(value: unknown, limit = 240): string | undefined {
  return typeof value === 'string' && value.length <= limit ? value : undefined
}

function positiveId(value: string, pattern: RegExp): string | null {
  return pattern.test(value) ? value : null
}

function sourceFor(pid: string, raw: Record<string, unknown>): LuoguProblemSource {
  if (pid.startsWith('CF')) return { type: 'codeforces', remoteId: pid.slice(2) }
  if (pid.startsWith('AT_')) {
    const remoteId = pid.slice(3).toLowerCase()
    const content = isRecord(raw.content) ? raw.content : null
    const description = shortText(raw.description, 20_000) ?? shortText(content?.description, 20_000)
    const matchedUrl = description?.match(/https:\/\/atcoder\.jp\/contests\/[A-Za-z0-9_-]+\/tasks\/[A-Za-z0-9_-]+/)?.[0]
    return { type: 'atcoder', remoteId, ...(matchedUrl ? { url: matchedUrl } : {}) }
  }
  if (/^P\d+$/i.test(pid)) return { type: 'luogu' }
  return { type: 'other' }
}

function finiteNumbers(value: unknown, limit = 16): readonly number[] {
  if (!Array.isArray(value) || value.length > limit) return []
  return value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
}

/** Sanitizes the only problem fields exposed to Features. */
export function sanitizeProblemDetails(value: unknown): LuoguProblemDetails | null {
  if (!isRecord(value) || typeof value.pid !== 'string' || !/^[A-Z0-9_]{1,40}$/i.test(value.pid)) return null
  const pid = value.pid.toUpperCase()
  const result: {
    pid: string
    title?: string
    difficulty?: number
    source?: LuoguProblemSource
    samples?: { input: string; output: string }[]
    timeLimitMs?: number
    memoryLimitMb?: number
  } = { pid, source: sourceFor(pid, value) }
  const content = isRecord(value.content) ? value.content : null
  const title = shortText(value.title) ?? shortText(value.name) ?? shortText(content?.name) ?? shortText(content?.title)
  if (title) result.title = title
  if (Number.isInteger(value.difficulty) && Number(value.difficulty) >= 0 && Number(value.difficulty) <= 8) {
    result.difficulty = Number(value.difficulty)
  }
  const rawSamples = Array.isArray(value.samples) ? value.samples : content?.samples
  if (Array.isArray(rawSamples) && rawSamples.length <= 50) {
    const samples: { input: string; output: string }[] = []
    for (const sample of rawSamples) {
      if (!Array.isArray(sample) || sample.length < 2) continue
      const input = shortText(sample[0], 200_000)
      const output = shortText(sample[1], 200_000)
      if (input !== undefined && output !== undefined) samples.push({ input, output })
    }
    result.samples = samples
  }
  const limits = isRecord(value.limits) ? value.limits : isRecord(content?.limits) ? content.limits : null
  if (limits) {
    const times = finiteNumbers(limits.time)
    const memories = finiteNumbers(limits.memory)
    if (times.length > 0) result.timeLimitMs = Math.max(...times)
    if (memories.length > 0) result.memoryLimitMb = Math.floor(Math.max(...memories) / 1024)
  }
  return result
}

function contentData(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null
  if (isRecord(value.currentData)) return value.currentData
  if (isRecord(value.data)) return value.data
  return value
}

function contestProblem(value: unknown): LuoguProblemSummary | null {
  if (!isRecord(value)) return null
  return sanitizeProblemDetails(isRecord(value.problem) ? value.problem : value)
}

export function sanitizeContestContext(value: unknown, expectedId: string): LuoguContestContext | null {
  const data = contentData(value)
  const contest = data && (isRecord(data.contest) ? data.contest : isRecord(data.currentContest) ? data.currentContest : null)
  if (!data || !contest) return null
  const id = String(contest.id ?? contest.cid ?? '')
  if (id !== expectedId) return null
  const rawProblems = Array.isArray(data.contestProblems) ? data.contestProblems
    : Array.isArray(data.problems) ? data.problems : Array.isArray(contest.problems) ? contest.problems : []
  if (rawProblems.length > 500) return null
  const problems = rawProblems.map(contestProblem).filter((item): item is LuoguProblemSummary => item !== null)
  const title = shortText(contest.name ?? contest.title)
  return { contestId: id, ...(title ? { title } : {}), problems }
}

export function sanitizeTrainingContext(value: unknown, expectedId: string): LuoguTrainingContext | null {
  const data = contentData(value)
  const training = data && (isRecord(data.training) ? data.training : isRecord(data.currentTraining) ? data.currentTraining : null)
  if (!data || !training) return null
  const id = String(training.id ?? training.tid ?? '')
  if (id !== expectedId) return null
  const rawProblems = Array.isArray(data.problems) ? data.problems
    : Array.isArray(training.problems) ? training.problems : Array.isArray(data.trainingProblems) ? data.trainingProblems : []
  if (rawProblems.length > 1000) return null
  const scores = isRecord(training.userScore) && isRecord(training.userScore.score)
    ? training.userScore.score
    : null
  const problems: LuoguTrainingProblem[] = []
  for (const raw of rawProblems) {
    if (!isRecord(raw)) continue
    const problem = contestProblem(raw)
    if (!problem) continue
    const fullScore = typeof raw.fullScore === 'number' && Number.isFinite(raw.fullScore) ? raw.fullScore : undefined
    const score = scores?.[problem.pid]
    let status: LuoguTrainingProblemStatus = 'unknown'
    if (raw.accepted === true) status = 'accepted'
    else if (raw.submitted === true) status = 'attempted'
    else if (raw.accepted === false && raw.submitted === false) status = 'new'
    else if (score === null) status = 'new'
    else if (typeof score === 'number' && Number.isFinite(score)) {
      status = fullScore !== undefined && score >= fullScore ? 'accepted' : 'attempted'
    }
    problems.push({ problem, status })
  }
  return { trainingId: id, problems }
}

export function sanitizeRecordProblems(value: unknown): readonly LuoguRecordProblem[] {
  const data = contentData(value)
  const result = isRecord(data?.records) && Array.isArray(data.records.result) ? data.records.result
    : Array.isArray(data?.records) ? data.records : Array.isArray(data?.result) ? data.result : []
  if (result.length > 500) return []
  const records: LuoguRecordProblem[] = []
  for (const raw of result) {
    if (!isRecord(raw) || !isRecord(raw.problem)) continue
    const problem = sanitizeProblemDetails(raw.problem)
    if (problem?.difficulty !== undefined) records.push({ pid: problem.pid, difficulty: problem.difficulty })
  }
  return records
}

export function createLuoguPageDataService(options: {
  readonly document: Document
  readonly network: NetworkService
  readonly session: LuoguSessionService
}): LuoguPageDataService {
  const requestContent = async (
    path: string,
    signal: AbortSignal | undefined,
    lentille = false,
    query: Readonly<Record<string, string>> = {},
  ): Promise<unknown> =>
    (await options.network.request<unknown>('luogu', {
      path, query: { ...query, _contentOnly: 1 }, headers: lentille ? { 'x-lentille-request': 'content-only' } : { 'x-luogu-type': 'content-only' }, responseType: 'json', ...(signal ? { signal } : {}),
    })).data
  async function* variants(path: string, signal?: AbortSignal, query: Readonly<Record<string, string>> = {}): AsyncGenerator<unknown> {
    for (const lentille of [false, true]) {
      if (signal?.aborted) break
      try { yield await requestContent(path, signal, lentille, query) }
      catch { /* try the other documented content response */ }
    }
  }
  return {
    async currentProblem(requestOptions = {}) {
      const pid = options.document.location.pathname.match(/^\/problem\/([A-Z0-9_]{1,40})/i)?.[1]
      return pid ? await this.problem(pid, requestOptions) : null
    },
    async problem(pid, requestOptions = {}) {
      const normalized = positiveId(pid.toUpperCase(), /^[A-Z0-9_]{1,40}$/)
      if (!normalized) return null
      for await (const value of variants(`/problem/${normalized}`, requestOptions.signal)) {
        const data = contentData(value)
        const problem = sanitizeProblemDetails(data?.problem ?? data?.content)
        if (problem) return problem
      }
      return null
    },
    async currentContest(requestOptions = {}) {
      const queryId = new URLSearchParams(options.document.location.search).get('contestId')
      const pathId = options.document.location.pathname.match(/^\/contest\/(\d+)/)?.[1]
      const id = queryId ?? pathId
      return id ? await this.contest(id, requestOptions) : null
    },
    async contest(contestId, requestOptions = {}) {
      const normalized = positiveId(contestId, /^[1-9]\d{0,15}$/)
      if (!normalized) return null
      for await (const value of variants(`/contest/${normalized}`, requestOptions.signal)) {
        const contest = sanitizeContestContext(value, normalized)
        if (contest) return contest
      }
      return null
    },
    async currentTraining(requestOptions = {}) {
      const id = options.document.location.pathname.match(/^\/training\/(\d+)/)?.[1]
      return id ? await this.training(id, requestOptions) : null
    },
    async training(trainingId, requestOptions = {}) {
      const normalized = positiveId(trainingId, /^[1-9]\d{0,15}$/)
      if (!normalized) return null
      for await (const value of variants(`/training/${normalized}`, requestOptions.signal)) {
        const training = sanitizeTrainingContext(value, normalized)
        if (training) return training
      }
      return null
    },
    async visibleRecords(requestOptions = {}) {
      if (!options.document.location.pathname.startsWith('/record')) return []
      const query = Object.fromEntries(new URLSearchParams(options.document.location.search))
      for await (const value of variants(options.document.location.pathname, requestOptions.signal, query)) {
        const records = sanitizeRecordProblems(value)
        if (records.length > 0) return records
      }
      return []
    },
    async acceptedProblemIds(requestOptions = {}) {
      const user = await options.session.currentUser(requestOptions)
      if (!user) return null
      for await (const value of variants(`/user/${user.uid}/practice`, requestOptions.signal)) {
        const data = contentData(value)
        if (!data || !Array.isArray(data.passed) || data.passed.length > 20_000) continue
        const pids = data.passed.flatMap((item) => {
          const problem = contestProblem(item)
          return problem ? [problem.pid] : []
        })
        return [...new Set(pids)]
      }
      return null
    },
    currentUserId() {
      const uid = options.document.location.pathname.match(/^\/user\/([1-9]\d*)/)?.[1]
      return uid ? Number(uid) : null
    },
  }
}
