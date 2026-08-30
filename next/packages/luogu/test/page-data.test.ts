import { describe, expect, it } from 'vitest'
import type { NetworkRequest, NetworkResponse, NetworkTarget } from '@exlg/runtime'
import { JSDOM } from 'jsdom'
import {
  createLuoguPageDataService,
  sanitizeContestContext,
  sanitizeProblemDetails,
  sanitizeRecordProblems,
  sanitizeTrainingContext,
} from '../src'

describe('Luogu Page Data sanitization', () => {
  it('exposes only bounded problem fields and derives trusted source metadata', () => {
    const problem = sanitizeProblemDetails({
      pid: 'AT_ABC100_A', title: 'Test', difficulty: 3,
      description: 'source https://atcoder.jp/contests/abc100/tasks/abc100_a token=private',
      samples: [['1', '2'], ['3', '4']],
      limits: { time: [1000, 2000], memory: [131072] },
      secret: 'not exposed',
    })
    expect(problem).toEqual({
      pid: 'AT_ABC100_A', title: 'Test', difficulty: 3,
      source: { type: 'atcoder', remoteId: 'abc100_a', url: 'https://atcoder.jp/contests/abc100/tasks/abc100_a' },
      samples: [{ input: '1', output: '2' }, { input: '3', output: '4' }],
      timeLimitMs: 2000, memoryLimitMb: 128,
    })
    expect(problem).not.toHaveProperty('description')
    expect(problem).not.toHaveProperty('secret')
    expect(sanitizeProblemDetails({ pid: 1 })).toBeNull()
    expect(sanitizeProblemDetails({ pid: 'P1000', samples: Array.from({ length: 51 }, () => ['', '']) })?.samples).toBeUndefined()
  })

  it('bounds contest arrays and removes extra contest fields', () => {
    const contest = sanitizeContestContext({ currentData: {
      contest: { id: 12, name: 'Contest', token: 'secret' },
      contestProblems: [{ problem: { pid: 'P1000', title: 'A' }, score: 100 }],
    } }, '12')
    expect(contest).toEqual({
      contestId: '12', title: 'Contest',
      problems: [{ pid: 'P1000', title: 'A', source: { type: 'luogu' } }],
    })
    expect(sanitizeContestContext({ currentData: { contest: { id: 12 }, contestProblems: [] } }, '13')).toBeNull()
  })

  it('maps training status while tolerating missing private score data', () => {
    const training = sanitizeTrainingContext({ currentData: { training: {
      id: 8,
      problems: [
        { problem: { pid: 'P1000' }, fullScore: 100 },
        { problem: { pid: 'P1001' }, fullScore: 100 },
        { problem: { pid: 'P1002' }, fullScore: 100 },
      ],
      userScore: { score: { P1000: null, P1001: 20, P1002: 100 } },
    } } }, '8')
    expect(training?.problems.map(item => item.status)).toEqual(['new', 'attempted', 'accepted'])
    const privateMissing = sanitizeTrainingContext({ currentData: {
      training: { id: 8, problems: [{ problem: { pid: 'P1000' } }] },
    } }, '8')
    expect(privateMissing?.problems[0]?.status).toBe('unknown')
    const lentille = sanitizeTrainingContext({ data: {
      training: { id: 8, name: 'Training' },
      problems: [
        { pid: 'P1000', name: 'A', accepted: true, submitted: true, token: 'secret' },
        { pid: 'P1001', content: { name: 'B' }, accepted: false, submitted: true },
        { pid: 'P1002', accepted: false, submitted: false },
      ],
    } }, '8')
    expect(lentille?.problems.map(item => [item.problem.title, item.status])).toEqual([
      ['A', 'accepted'], ['B', 'attempted'], [undefined, 'new'],
    ])
  })

  it('accepts current data wrappers and renamed problem title fields', () => {
    expect(sanitizeProblemDetails({ pid: 'P1000', content: { name: 'Current name' }, token: 'secret' })).toEqual({
      pid: 'P1000', title: 'Current name', source: { type: 'luogu' },
    })
    expect(sanitizeContestContext({ data: {
      contest: { cid: 9, title: 'New contest' },
      problems: [{ pid: 'P1000', name: 'Problem' }],
    } }, '9')).toEqual({
      contestId: '9', title: 'New contest',
      problems: [{ pid: 'P1000', title: 'Problem', source: { type: 'luogu' } }],
    })
  })

  it('maps record PID difficulty without returning record payloads', () => {
    const records = sanitizeRecordProblems({ currentData: { records: { result: [
      { id: 1, problem: { pid: 'P1000', difficulty: 2, secret: true } },
      { id: 2, problem: { pid: 'P1001', difficulty: 'bad' } },
    ] } } })
    expect(records).toEqual([{ pid: 'P1000', difficulty: 2 }])
    expect(sanitizeProblemDetails({ pid: 'P1008', difficulty: 8 })?.difficulty).toBe(8)
  })

  it('exposes only bounded accepted PIDs for the sanitized current user', async () => {
    const requests: string[] = []
    const service = createLuoguPageDataService({
      document: new JSDOM('', { url: 'https://www.luogu.com.cn/' }).window.document,
      session: { async currentUser() { return { uid: 42, name: 'not exposed' } } },
      network: {
        async request<T>(_target: NetworkTarget, request: NetworkRequest): Promise<NetworkResponse<T>> {
          requests.push(request.path)
          return { status: 200, ok: true, data: { status: 200, data: {
            passed: [{ pid: 'P1000', title: 'A', secret: 'removed' }, { pid: 'p1000' }, { pid: 'CF1A' }, { token: 'ignored' }],
          } } as T }
        },
      },
    })
    await expect(service.acceptedProblemIds()).resolves.toEqual(['P1000', 'CF1A'])
    expect(requests).toEqual(['/user/42/practice'])
  })

  it('does not request practice data when no current user is available', async () => {
    let requested = false
    const service = createLuoguPageDataService({
      document: new JSDOM('', { url: 'https://www.luogu.com.cn/' }).window.document,
      session: { async currentUser() { return null } },
      network: { async request<T>(): Promise<NetworkResponse<T>> { requested = true; throw new Error('unexpected') } },
    })
    await expect(service.acceptedProblemIds()).resolves.toBeNull()
    expect(requested).toBe(false)
  })
})
