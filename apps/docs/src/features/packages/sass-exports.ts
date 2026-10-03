import { firstSentenceOf, sassDocAbove } from './doc-summary.ts'
import type { DeclaredExport } from './module-exports.ts'

const MEMBER = /^(@mixin|@function)\s+([\w-]+)|^\$([\w-]+)\s*:/
const PRIVATE_PREFIX = /^[-_]/

const nameOf = (keyword: string | undefined, name: string): string => {
  if (keyword === undefined) {
    return `$${name}`
  }

  return keyword === '@function' ? `${name}()` : name
}

/**
 * The mixins, functions and variables a Sass module offers, skipping the
 * private ones Sass itself hides (`_name`, `-name`).
 */
export const sassExportsOf = (source: string): readonly DeclaredExport[] => {
  const lines = source.split(/\r?\n/)

  return lines.flatMap((line, lineIndex) => {
    const [, keyword, memberName, variableName] = MEMBER.exec(line) ?? []
    const name = memberName ?? variableName

    if (name === undefined || PRIVATE_PREFIX.test(name)) {
      return []
    }

    const doc = sassDocAbove(lines, lineIndex)

    return [
      {
        kind: 'sass' as const,
        name: nameOf(keyword, name),
        summary: doc === null ? null : firstSentenceOf(doc)
      }
    ]
  })
}
