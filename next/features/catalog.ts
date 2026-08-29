import type { AnyFeatureDefinition } from '@exlg/runtime'
import codeBlockCopy from './code-block-copy'
import problemNote from './problem-note'
import routeIndicator from './route-indicator'

export const featureCatalog = [
  codeBlockCopy,
  problemNote,
  routeIndicator,
] as readonly AnyFeatureDefinition[]
