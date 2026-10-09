import { withoutComments } from './source-comments.ts'

/** One `property: value` line of a stylesheet, with the block that holds it. */
export type Declaration = {
  /** The 0-based index of the line that opens the enclosing block, or -1 at the top. */
  block: number
  /** 1-based. */
  line: number
  property: string
  text: string
  value: string
}

const DECLARATION = /^\s*([\w-]+)\s*:\s*(.+?)\s*;?\s*$/
const OPENING_BRACE = /(^|[^#])\{/

const indentOf = (line: string) => line.length - line.trimStart().length

/** The block each line sits in, read from braces in CSS and from indentation in Sass. */
const enclosingBlocksByBraces = (lines: readonly string[]) => {
  const open: number[] = []
  return lines.map((line, index) => {
    const enclosing = open.at(-1) ?? -1
    let interpolation = 0
    for (let at = 0; at < line.length; at += 1) {
      const char = line.charAt(at)
      if (char === '{' && line.charAt(at - 1) === '#') interpolation += 1
      else if (char === '{') open.push(index)
      else if (char === '}' && interpolation > 0) interpolation -= 1
      else if (char === '}') open.pop()
    }
    return enclosing
  })
}

const enclosingBlocksByIndent = (lines: readonly string[]) => {
  const open: { indent: number; line: number }[] = []
  return lines.map((line, index) => {
    if (line.trim() === '') return open.at(-1)?.line ?? -1
    const indent = indentOf(line)
    while ((open.at(-1)?.indent ?? -1) >= indent) open.pop()
    const enclosing = open.at(-1)?.line ?? -1
    open.push({ indent, line: index })
    return enclosing
  })
}

/**
 * The block every line of the code sits in: the index of the line that opens
 * it, `-1` at the top. Braces decide in CSS, indentation in indented Sass.
 */
export const enclosingBlocks = (code: string): number[] => {
  const lines = code.split('\n')
  return OPENING_BRACE.test(code)
    ? enclosingBlocksByBraces(lines)
    : enclosingBlocksByIndent(lines)
}

/** Every `property: value` line of a stylesheet, comments left out. */
export const readDeclarations = (stylesheet: string): Declaration[] => {
  const lines = stylesheet.split('\n')
  const code = withoutComments(stylesheet)
  const blocks = enclosingBlocks(code)
  return code.split('\n').flatMap((codeLine, index) => {
    const declaration = DECLARATION.exec(codeLine)
    if (!declaration) return []
    const [, property = '', value = ''] = declaration
    const text = (lines[index] ?? codeLine).trim()
    return [
      { block: blocks[index] ?? -1, line: index + 1, property, text, value }
    ]
  })
}
