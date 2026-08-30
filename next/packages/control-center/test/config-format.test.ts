import { describe, expect, it, vi } from 'vitest'
import {
  defineFeature,
  setting,
  type Cleanup,
  type FeatureMetadata,
  type FeatureStatusSnapshot,
  type KernelController,
} from '@exlg/runtime'
import {
  applyConfigurationImport,
  createConfigurationExport,
  createDiagnosticReport,
  planConfigurationImport,
  stringifyConfiguration,
  validateConfiguration,
  sanitizeDiagnosticText,
  type ExlgConfigurationV1,
  type FeatureConfigurationController,
  type SettingValue,
} from '../src'

const first = defineFeature({
  id: 'official.first', apiVersion: 1, title: 'First', description: 'First', category: 'reading',
  defaultEnabled: true, matches: () => true, capabilities: [],
  settings: {
    flag: setting.boolean({ title: 'Flag', default: true }),
    mode: setting.select({ title: 'Mode', default: 'a', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }),
    count: setting.number({ title: 'Count', default: 4, min: 2, max: 10, step: 2, integer: true }),
    groups: setting.multiSelect({
      title: 'Groups', default: ['a'],
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
    }),
  },
})
const second = defineFeature({
  id: 'official.second', apiVersion: 1, title: 'Second', description: 'Second', category: 'problem',
  defaultEnabled: false, matches: () => true, capabilities: [],
  settings: { label: setting.string({ title: 'Label', default: '' }) },
})
const catalog: readonly FeatureMetadata[] = [first, second]

class FakeKernel implements KernelController {
  readonly states = new Map<string, FeatureStatusSnapshot>([
    [first.id, { id: first.id, status: 'mounted' }],
    [second.id, { id: second.id, status: 'disabled' }],
  ])
  readonly setFeatureEnabled = vi.fn(async (id: string, enabled: boolean) => {
    this.states.set(id, { id, status: enabled ? 'mounted' : 'disabled' })
  })
  readonly remountFeature = vi.fn(async () => undefined)
  readonly retryFeature = vi.fn(async () => undefined)
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  getFeatureStatus(id: string): FeatureStatusSnapshot { return this.states.get(id)! }
  subscribeFeatureStatus(): Cleanup { return () => undefined }
}

class FakeConfiguration implements FeatureConfigurationController {
  readonly values = new Map<string, Record<string, SettingValue>>([
    [first.id, { flag: true, mode: 'a', count: 4, groups: ['a'] }],
    [second.id, { label: '' }],
  ])
  readonly setMany = vi.fn(async (feature: FeatureMetadata, values: Readonly<Record<string, SettingValue>>) => {
    this.values.set(feature.id, { ...this.values.get(feature.id), ...values })
  })
  async getAll(feature: FeatureMetadata): Promise<Readonly<Record<string, SettingValue>>> { return this.values.get(feature.id) ?? {} }
  async set(feature: FeatureMetadata, name: string, value: SettingValue): Promise<void> { await this.setMany(feature, { [name]: value }) }
  async reset(feature: FeatureMetadata): Promise<void> { this.values.delete(feature.id) }
}

async function current(): Promise<ExlgConfigurationV1> {
  return await createConfigurationExport({
    catalog,
    kernel: new FakeKernel(),
    configuration: new FakeConfiguration(),
    environment: { host: 'userscript', version: '0.1.0', development: false },
    now: () => new Date('2026-01-01T00:00:00.000Z'),
  })
}

describe('configuration export', () => {
  it('uses the versioned stable format and only schema settings', async () => {
    const exported = await current()
    expect(exported).toEqual({
      format: 'exlg-next-configuration',
      version: 1,
      appVersion: '0.1.0',
      exportedAt: '2026-01-01T00:00:00.000Z',
      features: {
        'official.first': { enabled: true, settings: { count: 4, flag: true, groups: ['a'], mode: 'a' } },
        'official.second': { enabled: false, settings: { label: '' } },
      },
    })
    const text = stringifyConfiguration(exported)
    expect(text.endsWith('\n')).toBe(true)
    expect(text).not.toContain('exlg:vnext:data')
    expect(text).not.toContain('private body')
    expect(text).not.toContain('problem note')
  })
})

describe('diagnostic privacy', () => {
  it('removes query, hash, control characters, and non-diagnostic values', () => {
    const clean = sanitizeDiagnosticText('failed at https://example.test/path?token=secret#uid\u0000\nprivate body')
    expect(clean).toBe('failed at https://example.test/path?[redacted] private body')
    const report = createDiagnosticReport({
      environment: { host: 'webextension', version: '0.1.0', development: false },
      route: { key: '/problem/P1000?token=secret#hash', kind: 'problem', url: new URL('https://www.luogu.com.cn/problem/P1000?token=secret#hash'), params: {} },
      statuses: [{ id: first.id, status: 'error', lastError: 'https://api.test/path?csrf=secret#token' }],
    })
    expect(report).toContain('"pathname": "/problem/P1000"')
    expect(report).toContain('https://api.test/path?[redacted]')
    expect(report).not.toContain('csrf=secret')
    expect(report).not.toContain('token=secret')
    expect(report).not.toContain('settings')
  })
})

describe('configuration validation and planning', () => {
  it('rejects invalid format and unknown version', () => {
    expect(() => validateConfiguration('{"format":"other","version":1,"features":{}}', catalog)).toThrow('格式标识')
    expect(() => validateConfiguration('{"format":"exlg-next-configuration","version":2,"features":{}}', catalog)).toThrow('配置版本')
  })

  it('ignores unknown features, settings, wrong types, and invalid selects', () => {
    const validated = validateConfiguration(JSON.stringify({
      format: 'exlg-next-configuration', version: 1, features: {
        unknown: { enabled: true, settings: {} },
        'official.first': {
          enabled: false,
          settings: { flag: 'yes', mode: 'missing', count: 3, groups: ['missing'], extra: true },
        },
      },
    }), catalog)
    expect(validated.ignoredUnknownFeatures).toBe(1)
    expect(validated.ignoredInvalidSettings).toBe(5)
    expect(validated.features[0]).toEqual({ id: first.id, enabled: false, settings: {} })
  })

  it('normalizes number and multi-select values without mutating source arrays', () => {
    const source = ['b', 'a', 'b']
    const validated = validateConfiguration(JSON.stringify({
      format: 'exlg-next-configuration', version: 1, features: {
        'official.first': { enabled: true, settings: { count: 6, groups: source } },
      },
    }), catalog)
    source.push('unknown')
    expect(validated.features[0]?.settings).toEqual({ count: 6, groups: ['a', 'b'] })
  })

  it('rejects prototype pollution keys', () => {
    const text = '{"format":"exlg-next-configuration","version":1,"features":{"__proto__":{"enabled":true,"settings":{}}}}'
    expect(() => validateConfiguration(text, catalog)).toThrow('不安全')
  })

  it('plans merge changes without modifying absent features', async () => {
    const validated = validateConfiguration(JSON.stringify({
      format: 'exlg-next-configuration', version: 1, features: {
        'official.first': { enabled: false, settings: { mode: 'b' } },
      },
    }), catalog)
    const plan = planConfigurationImport(validated, await current())
    expect(plan).toMatchObject({ featureUpdates: 1, settingUpdates: 1, disableUpdates: 1, enableUpdates: 0 })
    expect(plan.features.map(feature => feature.id)).toEqual([first.id])
  })
})

describe('configuration application', () => {
  it('writes settings in one batch and remounts an unchanged enabled feature once', async () => {
    const kernel = new FakeKernel()
    const configuration = new FakeConfiguration()
    const validated = validateConfiguration(JSON.stringify({
      format: 'exlg-next-configuration', version: 1, features: {
        'official.first': { enabled: true, settings: { flag: false, mode: 'b', count: 6, groups: ['b', 'a'] } },
      },
    }), catalog)
    const result = await applyConfigurationImport({
      plan: planConfigurationImport(validated, await current()), catalog, kernel, configuration,
    })
    expect(result.failedFeatures).toEqual([])
    expect(configuration.setMany).toHaveBeenCalledOnce()
    expect(kernel.remountFeature).toHaveBeenCalledOnce()
    expect(kernel.setFeatureEnabled).not.toHaveBeenCalled()
  })

  it('continues after one feature fails', async () => {
    const kernel = new FakeKernel()
    const configuration = new FakeConfiguration()
    configuration.setMany.mockImplementationOnce(async () => { throw new Error('write failed') })
    const validated = validateConfiguration(JSON.stringify({
      format: 'exlg-next-configuration', version: 1, features: {
        'official.first': { enabled: true, settings: { flag: false } },
        'official.second': { enabled: true, settings: { label: 'ok' } },
      },
    }), catalog)
    const result = await applyConfigurationImport({
      plan: planConfigurationImport(validated, await current()), catalog, kernel, configuration,
    })
    expect(result.failedFeatures.map(item => item.id)).toEqual([first.id])
    expect(result.appliedFeatures).toBe(1)
    expect(kernel.setFeatureEnabled).toHaveBeenCalledWith(second.id, true)
  })
})
