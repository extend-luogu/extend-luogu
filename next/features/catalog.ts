import type { LuoguFeatureContextExtension } from '@exlg/luogu'
import type { AnyFeatureDefinition } from '@exlg/runtime'
import codeBlockCopy from './code-block-copy'
import privateMessageNotifier from './private-message-notifier'
import problemNote from './problem-note'
import routeIndicator from './route-indicator'

export const featureCatalog = [
  codeBlockCopy,
  problemNote,
  routeIndicator,
  privateMessageNotifier,
] as unknown as readonly AnyFeatureDefinition<LuoguFeatureContextExtension>[]
