export interface ProblemListPage {
  readonly count: number
  readonly perPage: number
  readonly pids: readonly string[]
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

export function parseProblemList(value: unknown): ProblemListPage | null {
  const response = record(value)
  if (!response) return null
  const status = response.status ?? response.code
  if (status !== undefined && status !== 200) return null
  const data = record(response.data) ?? record(response.currentData)
  const problems = record(data?.problems)
  if (!problems
    || !Number.isSafeInteger(problems.count) || Number(problems.count) < 0
    || !Number.isSafeInteger(problems.perPage) || Number(problems.perPage) <= 0
    || !Array.isArray(problems.result) || problems.result.length > 100) return null
  const pids = problems.result.flatMap((item) => {
    const problem = record(item)
    return typeof problem?.pid === 'string' && /^[A-Z0-9_]{1,40}$/i.test(problem.pid)
      ? [problem.pid.toUpperCase()]
      : []
  })
  return { count: Number(problems.count), perPage: Number(problems.perPage), pids }
}

export function randomIndex(length: number, random: () => number): number {
  if (length <= 0) return 0
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)))
}

export function chooseFilter(
  difficulties: readonly string[],
  sources: readonly string[],
  random: () => number,
): { readonly difficulty?: number; readonly type: string } {
  const selectedDifficulty = difficulties[randomIndex(difficulties.length, random)]
  const selectedSource = sources[randomIndex(sources.length, random)] ?? 'P'
  const difficulty = selectedDifficulty === undefined ? undefined : Number(selectedDifficulty)
  return typeof difficulty === 'number' && Number.isSafeInteger(difficulty) && difficulty !== 0
    ? { difficulty, type: selectedSource }
    : { type: selectedSource }
}

export function excludeKnownAccepted(
  pids: readonly string[],
  accepted: ReadonlySet<string> | null,
): readonly string[] {
  return accepted ? pids.filter(pid => !accepted.has(pid)) : [...pids]
}
