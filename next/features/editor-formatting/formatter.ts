export interface FormattingOptions {
  readonly spacingCjkLatin: boolean
  readonly spacingCjkNumber: boolean
  readonly spacingInlineMath: boolean
  readonly normalizeSpaces: boolean
  readonly normalizePunctuation: boolean
}

const protectedToken = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|\$\$[\s\S]*?\$\$|\$(?!\$)[^$\n]+\$|!?(?:\[[^\]\n]*\])\([^\s)]+(?:\s+"[^"]*")?\)|https?:\/\/[^\s<]+|<[^>\n]+>|\\[A-Za-z]+(?:\{[^}\n]*\})*/g
const cjk = '\\p{Script=Han}'
const latin = 'A-Za-z'

function formatText(text: string, options: FormattingOptions): string {
  let result = text
  if (options.normalizeSpaces) result = result.replace(/[ \t]{2,}/g, ' ')
  if (options.spacingCjkLatin) {
    result = result
      .replace(new RegExp(`([${cjk}])([${latin}])`, 'gu'), '$1 $2')
      .replace(new RegExp(`([${latin}])([${cjk}])`, 'gu'), '$1 $2')
  }
  if (options.spacingCjkNumber) {
    result = result
      .replace(new RegExp(`([${cjk}])(\\d)`, 'gu'), '$1 $2')
      .replace(new RegExp(`(\\d)([${cjk}])`, 'gu'), '$1 $2')
  }
  if (options.normalizePunctuation) result = result.replace(/,([\p{Script=Han}])/gu, '，$1').replace(/\.([\p{Script=Han}])/gu, '。$1')
  return result
}

/** Formats prose while preserving Markdown/code/URL/HTML/LaTeX tokens byte-for-byte. */
export function formatMarkdown(source: string, options: FormattingOptions): string {
  let result = ''
  let cursor = 0
  for (const match of source.matchAll(protectedToken)) {
    const index = match.index
    result += formatText(source.slice(cursor, index), options)
    const token = match[0]
    const inlineMath = token.startsWith('$') && !token.startsWith('$$')
    if (options.spacingInlineMath && inlineMath && /\p{Script=Han}$/u.test(result)) result += ' '
    result += token
    if (options.spacingInlineMath && inlineMath && /^\p{Script=Han}/u.test(source.slice(index + token.length))) result += ' '
    cursor = index + match[0].length
  }
  return result + formatText(source.slice(cursor), options)
}
