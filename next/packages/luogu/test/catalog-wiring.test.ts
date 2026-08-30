import { describe, expect, it } from 'vitest'
import { featureCatalog } from '../../../features/catalog'
import type { RouteKind, RouteSnapshot } from '@exlg/runtime'

function route(kind: RouteKind): RouteSnapshot {
  return { kind, key: `/${kind}`, url: new URL(`https://www.luogu.com.cn/${kind}`), params: {} }
}

describe('shared host catalog', () => {
  it('ships one shared, duplicate-free catalog with every migration Feature', () => {
    const ids = featureCatalog.map(feature => feature.id)
    expect(ids).toHaveLength(20)
    expect(new Set(ids)).toHaveLength(ids.length)
    expect(ids).toEqual(expect.arrayContaining([
      'official.code-block-copy',
      'official.user-introduction',
      'official.solution-spoiler-guard',
      'official.back-to-contest',
      'official.record-difficulty-colors',
      'official.home-discussion-density',
      'official.auto-o2',
      'official.editor-emoticons',
      'official.editor-shortcuts',
      'official.editor-formatting',
      'official.quick-navigation',
      'official.random-problem',
      'official.training-randomizer',
      'official.tasklist-enhancer',
      'official.original-difficulty',
      'official.import-to-cph',
      'official.user-notes',
      'official.problem-note',
      'official.route-indicator',
      'official.private-message-notifier',
    ]))
    for (const feature of featureCatalog) {
      if (feature.id === 'official.code-block-copy') expect(feature.defaultEnabled).toBe(true)
      else if (!['official.problem-note', 'official.route-indicator', 'official.private-message-notifier'].includes(feature.id)) {
        expect(feature.defaultEnabled, feature.id).toBe(false)
      }
    }
  })

  it('keeps each migrated Feature on its declared route boundary', () => {
    const byId = new Map(featureCatalog.map(feature => [feature.id, feature]))
    const only = (id: string, accepted: readonly RouteKind[]): void => {
      const feature = byId.get(id)!
      for (const kind of ['home', 'problem', 'record', 'discussion', 'user', 'contest', 'training', 'blog', 'chat', 'unknown'] as const) {
        expect(feature.matches(route(kind)), `${id} on ${kind}`).toBe(accepted.includes(kind))
      }
    }
    only('official.user-introduction', ['user'])
    for (const id of ['official.solution-spoiler-guard', 'official.back-to-contest', 'official.auto-o2', 'official.original-difficulty']) only(id, ['problem'])
    only('official.record-difficulty-colors', ['record'])
    for (const id of ['official.home-discussion-density', 'official.random-problem', 'official.tasklist-enhancer']) only(id, ['home'])
    for (const id of ['official.editor-emoticons', 'official.editor-shortcuts', 'official.editor-formatting']) only(id, ['discussion', 'blog'])
    only('official.training-randomizer', ['training'])
    only('official.import-to-cph', ['problem', 'contest'])
  })
})
