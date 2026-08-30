import { describe, expect, it } from 'vitest'
import { applyProblemTemplate, createCphPayload } from './payload'

describe('CPH payload', () => {
  it('uses only supported substitutions', () => expect(applyProblemTemplate('${cid}_${pid}_${title}_${unknown}', { cid: '1', pid: 'P2', title: '题目' })).toBe('1_P2_题目_${unknown}'))
  it('contains only sanitized problem fields', () => {
    const payload = createCphPayload({ pid: 'P1000', title: 'A+B', samples: [{ input: '1 2', output: '3' }], memoryLimitMb: 128, timeLimitMs: 1000 }, { origin: 'https://www.luogu.com.cn', name: 'Luogu_P1000', batchId: 'x', batchSize: 1 })
    expect(payload).toMatchObject({ name: 'Luogu_P1000', url: 'https://www.luogu.com.cn/problem/P1000', memoryLimit: 128, tests: [{ input: '1 2', output: '3' }] })
    expect(JSON.stringify(payload)).not.toContain('cookie')
  })
})
