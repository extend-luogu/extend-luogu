import { describe, expect, it } from 'vitest'
import { defineFeature, setting, type JsonValue } from '@exlg/runtime'
import {
  FeatureConfigurationController,
  type JsonKeyValueStore,
} from '../src'

class MemoryStore implements JsonKeyValueStore {
  readonly values = new Map<string, unknown>()
  readonly writes: string[] = []
  readonly deletes: string[] = []
  async get(key: string): Promise<unknown> { return this.values.get(key) }
  async set(key: string, value: JsonValue): Promise<void> {
    this.writes.push(key)
    this.values.set(key, value)
  }
  async delete(key: string): Promise<void> {
    this.deletes.push(key)
    this.values.delete(key)
  }
}

const feature = defineFeature({
  id: 'official.settings-test',
  apiVersion: 1,
  title: 'Settings test',
  description: 'Settings test',
  category: 'test',
  defaultEnabled: true,
  matches: () => true,
  capabilities: [],
  settings: {
    enabled: setting.boolean({ title: 'Enabled', default: true }),
    label: setting.string({ title: 'Label', default: 'default' }),
    mode: setting.select({
      title: 'Mode',
      default: 'a',
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
    }),
    count: setting.number({ title: 'Count', default: 4, min: 2, max: 10, step: 2, integer: true }),
    groups: setting.multiSelect({
      title: 'Groups', default: ['a'],
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
    }),
  },
})

describe('FeatureConfigurationController', () => {
  it('merges defaults and discards damaged values', async () => {
    const store = new MemoryStore()
    store.values.set(`exlg:vnext:settings:${feature.id}`, {
      values: {
        enabled: 'bad', label: 'stored', mode: 'missing', count: 3,
        groups: ['b', 'a', 'b'], extra: true,
      },
    })
    const controller = new FeatureConfigurationController(store)
    await expect(controller.getAll(feature)).resolves.toEqual({
      enabled: true,
      label: 'stored',
      mode: 'a',
      count: 4,
      groups: ['a', 'b'],
    })
  })

  it('validates names, types, and select options', async () => {
    const controller = new FeatureConfigurationController(new MemoryStore())
    await expect(controller.set(feature, 'missing', true)).rejects.toThrow('Invalid setting')
    await expect(controller.set(feature, 'enabled', 'yes')).rejects.toThrow('Invalid setting')
    await expect(controller.set(feature, 'mode', 'c')).rejects.toThrow('Invalid setting')
    await expect(controller.set(feature, 'count', 3)).rejects.toThrow('Invalid setting')
    await expect(controller.set(feature, 'groups', ['missing'])).rejects.toThrow('Invalid setting')
  })

  it('uses one settings write for setMany and shares it with FeatureSettings', async () => {
    const store = new MemoryStore()
    const controller = new FeatureConfigurationController(store)
    const selected = ['b', 'a', 'b']
    await controller.setMany(feature, { label: 'next', mode: 'b', count: 6, groups: selected })
    selected.push('missing')
    expect(store.writes).toEqual([`exlg:vnext:settings:${feature.id}`])
    await expect(controller.settings(feature).getAll()).resolves.toEqual({
      enabled: true,
      label: 'next',
      mode: 'b',
      count: 6,
      groups: ['a', 'b'],
    })
  })

  it('reset deletes only the settings namespace', async () => {
    const store = new MemoryStore()
    const settingsKey = `exlg:vnext:settings:${feature.id}`
    const dataKey = `exlg:vnext:data:${feature.id}`
    store.values.set(settingsKey, { values: { label: 'custom' } })
    store.values.set(dataKey, { values: { note: 'keep me' } })
    const controller = new FeatureConfigurationController(store)
    await controller.reset(feature)
    expect(store.deletes).toEqual([settingsKey])
    expect(store.values.get(dataKey)).toEqual({ values: { note: 'keep me' } })
    await expect(controller.getAll(feature)).resolves.toMatchObject({ label: 'default' })
  })
})
