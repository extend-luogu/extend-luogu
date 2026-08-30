import { describe, expect, it } from 'vitest'
import { featureCatalog } from '../../../features/catalog'

describe('shared host catalog', () => {
  it('ships the private-message notifier in the shared catalog', () => {
    expect(featureCatalog.map(feature => feature.id)).toContain('official.private-message-notifier')
  })
})
