export interface CodeforcesProblem { readonly index: string; readonly rating?: number }

export function parseCodeforcesPid(pid: string): { readonly contestId: number; readonly index: string } | null {
  const match = pid.toUpperCase().match(/^CF([1-9]\d*)([A-Z]\d?)$/)
  return match?.[1] && match[2] ? { contestId: Number(match[1]), index: match[2] } : null
}

export function codeforcesRating(value: unknown, index: string): number | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const response = value as Record<string, unknown>
  if (response.status !== 'OK' || typeof response.result !== 'object' || response.result === null || Array.isArray(response.result)) return null
  const problems = (response.result as Record<string, unknown>).problems
  if (!Array.isArray(problems) || problems.length > 100) return null
  for (const problem of problems) {
    if (typeof problem !== 'object' || problem === null || Array.isArray(problem)) continue
    const candidate = problem as Record<string, unknown>
    if (candidate.index === index && typeof candidate.rating === 'number' && Number.isFinite(candidate.rating)) return candidate.rating
  }
  return null
}

export function normalizeAtCoderDifficulty(value: number): number {
  return Math.round(value >= 400 ? value : 400 / Math.exp(1 - value / 400))
}

export function atCoderDifficultyMap(value: unknown, limit = 50_000): Readonly<Record<string, number>> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const entries = Object.entries(value)
  if (entries.length > limit) return null
  const result: Record<string, number> = {}
  for (const [id, model] of entries) {
    if (!/^[a-z0-9_]{1,80}$/i.test(id) || typeof model !== 'object' || model === null || Array.isArray(model)) continue
    const difficulty = (model as Record<string, unknown>).difficulty
    if (typeof difficulty === 'number' && Number.isFinite(difficulty)) result[id.toLowerCase()] = normalizeAtCoderDifficulty(difficulty)
  }
  return result
}
