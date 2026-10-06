import { type ChildNode, type Root, sass, scss } from 'sass-parser'

import { firstSentenceOf } from './doc-summary.ts'
import type { DeclaredExport } from './module-exports.ts'

const PRIVATE_PREFIX = /^[-_]/
const SASSDOC_LINE_MARK = /^\/ ?/

/** The name a consumer writes for a member at the module's top level, or `null` for anything else. */
const memberNameOf = (node: ChildNode): string | null => {
  switch (node.sassType) {
    case 'mixin-rule':
      return PRIVATE_PREFIX.test(node.mixinName) ? null : node.mixinName
    case 'function-rule':
      return PRIVATE_PREFIX.test(node.functionName)
        ? null
        : `${node.functionName}()`
    case 'variable-declaration':
      return PRIVATE_PREFIX.test(node.variableName)
        ? null
        : `$${node.variableName}`
    default:
      return null
  }
}

/** The `///` lines right above a member, touching it: SassDoc's doc comment. */
const sassDocOf = (node: ChildNode): string | null => {
  const comment = node.prev()
  const commentEnd = comment?.source?.end?.line
  const nodeStart = node.source?.start?.line

  if (
    comment?.sassType !== 'sass-comment' ||
    commentEnd === undefined ||
    nodeStart !== commentEnd + 1
  ) {
    return null
  }

  const lines = comment.text.split('\n')

  return lines.every((line) => SASSDOC_LINE_MARK.test(line))
    ? lines.map((line) => line.replace(SASSDOC_LINE_MARK, '')).join('\n')
    : null
}

const parseStylesheet = ({
  path,
  source
}: {
  path: string
  source: string
}): Root => (path.endsWith('.scss') ? scss : sass).parse(source)

/**
 * The mixins, functions and variables a Sass module offers at its top level,
 * skipping the private ones Sass itself hides (`_name`, `-name`).
 */
export const sassExportsOf = (stylesheet: {
  path: string
  source: string
}): readonly DeclaredExport[] =>
  parseStylesheet(stylesheet).nodes.flatMap((node) => {
    const name = memberNameOf(node)

    if (name === null) {
      return []
    }

    const doc = sassDocOf(node)

    return [
      {
        kind: 'sass' as const,
        name,
        summary: doc === null ? null : firstSentenceOf(doc)
      }
    ]
  })
