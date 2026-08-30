import codeBlockCopy from './code-block-copy'
import autoO2 from './auto-o2'
import backToContest from './back-to-contest'
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
  codeBlockCopy,
  userIntroduction,
  solutionSpoilerGuard,
  backToContest,
  recordDifficultyColors,
  homeDiscussionDensity,
  autoO2,
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
