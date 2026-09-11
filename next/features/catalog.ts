import editorEmoticons from './editor-emoticons'
import editorFormatting from './editor-formatting'
import editorShortcuts from './editor-shortcuts'
import homeDiscussionDensity from './home-discussion-density'
import importToCph from './import-to-cph'
import originalDifficulty from './original-difficulty'
import privateMessageNotifier from './private-message-notifier'
import problemNote from './problem-note'
import quickNavigation from './quick-navigation'
import randomProblem from './random-problem'
import recordDifficultyColors from './record-difficulty-colors'
import routeIndicator from './route-indicator'
import solutionSpoilerGuard from './solution-spoiler-guard'
import tasklistEnhancer from './tasklist-enhancer'
import trainingRandomizer from './training-randomizer'
import userIntroduction from './user-introduction'
import userNotes from './user-notes'

export const featureCatalog = [
  userIntroduction,
  solutionSpoilerGuard,
  recordDifficultyColors,
  homeDiscussionDensity,
  editorEmoticons,
  editorShortcuts,
  editorFormatting,
  quickNavigation,
  randomProblem,
  trainingRandomizer,
  tasklistEnhancer,
  originalDifficulty,
  importToCph,
  userNotes,
  problemNote,
  routeIndicator,
  privateMessageNotifier,
] as const
