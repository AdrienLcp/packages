import { withoutComments } from './source-comments.ts'
import { enclosingBlocks } from './stylesheet-declarations.ts'

/** A face that downloads a file: a `fonts.font-face` include or an `@font-face` with a `url()` source. */
export type WebFace = {
  family: string
  style: string
}

/** The weight range one fallback face covers, for one family and one style. */
export type FallbackBand = {
  family: string
  style: string
  weights: readonly [number, number]
}

/** A face whose family or weights a stylesheet builds where the audit cannot read them. */
export type UnreadFace = {
  declaration: string
  kind: 'unread-family' | 'unread-weights'
  line: number
}

/** A mixin of the app's own that writes a face for the family it is passed. */
export type FaceMixin = {
  name: string
  parameter: string
  position: number
}

/** What one stylesheet says about its fonts. */
export type FontFaceReading = {
  bands: FallbackBand[]
  faces: WebFace[]
  mixins: FaceMixin[]
  unread: UnreadFace[]
}

type ArgumentList = {
  named: ReadonlyMap<string, string>
  positional: readonly string[]
}

type Mixin = { name: string; parameters: readonly string[] }

type Context = {
  blocks: readonly number[]
  code: string
  lines: readonly string[]
  variables: ReadonlyMap<string, string>
}

const FONT_FACE_CALL = /(?<![@\w-])font-face\(/g
const FALLBACK_FACES_CALL = /(?<![@\w-])fallback-faces\(/g
const FONT_FACE_RULE = /@font-face\b/g
const MIXIN_HEADER = /@mixin\s+([\w-]+)\s*\(([^)]*)\)/
const VARIABLE = /^\s*\$([\w-]+)\s*:\s*(.+?)\s*(?:!default)?\s*;?\s*$/gm
const VARIABLE_READ = /\$([\w-]+)/g
const QUOTED = /^(['"])(.*)\1$/s
const UNQUOTED_NAME = /^[A-Za-z][\w -]*$/
const WEIGHT_RANGE = /^(\d+)(?:\s+(\d+))?$/
const FALLBACK_SUFFIX = / fallback$/i
const FACE_FAMILY = /(?:^|[;{\s])font-family\s*:\s*([^;\n}]+?)\s*(?:;|\}|$)/m
const FACE_STYLE = /(?:^|[;{\s])font-style\s*:\s*([^;\n}]+?)\s*(?:;|\}|$)/m
const FACE_WEIGHT = /(?:^|[;{\s])font-weight\s*:\s*([^;\n}]+?)\s*(?:;|\}|$)/m
const URL_SOURCE = /\bsrc\s*:[^;}]*\burl\(/
const LOCAL_SOURCE = /\bsrc\s*:[^;}]*\blocal\(/

const FONT_FACE_PARAMETERS = [
  'family',
  'url',
  'unicode-range',
  'weight',
  'style'
]
const FALLBACK_FACES_PARAMETERS = [
  'family',
  'metrics',
  'size-adjust',
  'widths',
  'bold-from',
  'trimmed-to-capitals',
  'style',
  'figures',
  'figure-separators',
  'stretch'
]
const KEYWORD_WEIGHTS: Readonly<Record<string, number>> = {
  bold: 700,
  normal: 400
}

const lineAt = (code: string, index: number) =>
  code.slice(0, index).split('\n').length

const quotedOrBare = (text: string) => {
  const [, , unquoted = text.trim()] = QUOTED.exec(text.trim()) ?? []
  return unquoted
}

/** The text between the parenthesis at `open` and its match, split on top-level commas. */
const splitArguments = (code: string, open: number) => {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let start = open + 1
  for (let index = open; index < code.length; index += 1) {
    const char = code.charAt(index)
    if (quote !== '') {
      if (char === quote) quote = ''
    } else if (char === '"' || char === "'") quote = char
    else if (char === '(') depth += 1
    else if (char === ')') {
      depth -= 1
      if (depth === 0) {
        parts.push(code.slice(start, index))
        return parts.map((part) => part.trim()).filter((part) => part !== '')
      }
    } else if (char === ',' && depth === 1) {
      parts.push(code.slice(start, index))
      start = index + 1
    }
  }
  return parts.map((part) => part.trim())
}

const NAMED_ARGUMENT = /^\$([\w-]+)\s*:\s*([\s\S]+)$/

const readArguments = (code: string, open: number): ArgumentList => {
  const named = new Map<string, string>()
  const positional: string[] = []
  for (const part of splitArguments(code, open)) {
    const [, name, value = ''] = NAMED_ARGUMENT.exec(part) ?? []
    if (name === undefined) positional.push(part)
    else named.set(name, value.trim())
  }
  return { named, positional }
}

const argument = (
  list: ArgumentList,
  parameters: readonly string[],
  name: string
) => list.named.get(name) ?? list.positional[parameters.indexOf(name)]

const readVariables = (code: string) => {
  const values = new Map<string, Set<string>>()
  for (const [, name = '', value = ''] of code.matchAll(VARIABLE)) {
    const seen = values.get(name) ?? new Set<string>()
    seen.add(value)
    values.set(name, seen)
  }
  return new Map(
    [...values]
      .filter(([, seen]) => seen.size === 1)
      .map(([name, [value = '']]) => [name, value])
  )
}

/** An expression's value when it is a literal or a variable assigned one literal in the same file. */
const resolve = (
  expression: string,
  variables: ReadonlyMap<string, string>
): string | undefined => {
  const text = expression.trim()
  const [, variable] = /^\$([\w-]+)$/.exec(text) ?? []
  if (variable !== undefined) {
    const value = variables.get(variable)
    return value === undefined || value.trim().startsWith('$')
      ? undefined
      : resolve(value, variables)
  }
  return text
}

const resolveName = (
  expression: string,
  variables: ReadonlyMap<string, string>
) => {
  const value = resolve(expression, variables)
  if (value === undefined || value.includes('#{') || value.includes('$'))
    return undefined
  const name = quotedOrBare(value)
  return QUOTED.test(value.trim()) || UNQUOTED_NAME.test(name)
    ? name
    : undefined
}

const enclosingMixin = (
  context: Context,
  lineIndex: number
): Mixin | undefined => {
  let block = context.blocks[lineIndex] ?? -1
  while (block >= 0) {
    const [, name, parameters = ''] =
      MIXIN_HEADER.exec(context.lines[block] ?? '') ?? []
    if (name !== undefined)
      return {
        name,
        parameters: parameters
          .split(',')
          .map((parameter) => /\$([\w-]+)/.exec(parameter)?.[1] ?? '')
      }
    block = context.blocks[block] ?? -1
  }
  return undefined
}

/** The mixin parameter an expression reads, when it sits in a mixin that takes it. */
const mixinParameterRead = (
  context: Context,
  lineIndex: number,
  expression: string
) => {
  const mixin = enclosingMixin(context, lineIndex)
  if (mixin === undefined) return undefined
  const read = [...expression.matchAll(VARIABLE_READ)].map(
    ([, name = '']) => name
  )
  const parameter = read.find((name) => mixin.parameters.includes(name))
  return parameter === undefined
    ? undefined
    : {
        name: mixin.name,
        parameter,
        position: mixin.parameters.indexOf(parameter)
      }
}

const styleOf = (expression: string | undefined, context: Context) =>
  expression === undefined
    ? 'normal'
    : quotedOrBare(resolve(expression, context.variables) ?? 'normal')

const weightRange = (text: string): [number, number] | undefined => {
  const keyword = KEYWORD_WEIGHTS[text.trim()]
  if (keyword !== undefined) return [keyword, keyword]
  const range = WEIGHT_RANGE.exec(text.trim())
  if (!range) return undefined
  const from = Number(range[1])
  return [from, range[2] === undefined ? from : Number(range[2])]
}

/** The weight ranges a `$widths` map holds, or `undefined` when one key is not a literal range. */
const widthBands = (expression: string, context: Context) => {
  const map = resolve(expression, context.variables)?.trim()
  if (map === undefined || !map.startsWith('(')) return undefined
  const ranges = splitArguments(map, 0).map((entry) =>
    weightRange(entry.slice(0, entry.lastIndexOf(':')))
  )
  return ranges.every((range) => range !== undefined) ? ranges : undefined
}

/** The body of the `@font-face` at `start`: braces in CSS, deeper lines in indented Sass. */
const fontFaceBody = (source: string, start: number) => {
  const lineStart = source.lastIndexOf('\n', start) + 1
  const headerEnd = source.indexOf('\n', start)
  const header = source.slice(start, headerEnd === -1 ? undefined : headerEnd)
  if (header.includes('{')) {
    const open = source.indexOf('{', start)
    return source.slice(open + 1, source.indexOf('}', open))
  }
  if (headerEnd === -1) return ''
  const indent = source.slice(lineStart, start).length
  const body: string[] = []
  for (const line of source.slice(headerEnd + 1).split('\n')) {
    if (line.trim() !== '' && line.length - line.trimStart().length <= indent)
      break
    body.push(line)
  }
  return body.join('\n')
}

const declarationAt = (context: Context, lineIndex: number) =>
  (context.lines[lineIndex] ?? '').trim()

/**
 * Reads a family that is not a literal: a mixin parameter registers the mixin
 * and passes, anything else is unread.
 */
const familyOrUnread = (
  context: Context,
  collected: FontFaceReading,
  lineIndex: number,
  expression: string
) => {
  const family = resolveName(expression, context.variables)
  if (family !== undefined) return family
  const mixin = mixinParameterRead(context, lineIndex, expression)
  if (mixin) collected.mixins.push(mixin)
  else
    collected.unread.push({
      declaration: declarationAt(context, lineIndex),
      kind: 'unread-family',
      line: lineIndex + 1
    })
  return undefined
}

const readFontFaceCalls = (context: Context, collected: FontFaceReading) => {
  for (const { 0: call, index } of context.code.matchAll(FONT_FACE_CALL)) {
    const lineIndex = lineAt(context.code, index) - 1
    const list = readArguments(context.code, index + call.length - 1)
    const family = familyOrUnread(
      context,
      collected,
      lineIndex,
      argument(list, FONT_FACE_PARAMETERS, 'family') ?? ''
    )
    if (family !== undefined)
      collected.faces.push({
        family,
        style: styleOf(argument(list, FONT_FACE_PARAMETERS, 'style'), context)
      })
  }
}

const readFallbackFacesCalls = (
  context: Context,
  collected: FontFaceReading
) => {
  for (const { 0: call, index } of context.code.matchAll(FALLBACK_FACES_CALL)) {
    const lineIndex = lineAt(context.code, index) - 1
    const list = readArguments(context.code, index + call.length - 1)
    const family = familyOrUnread(
      context,
      collected,
      lineIndex,
      argument(list, FALLBACK_FACES_PARAMETERS, 'family') ?? ''
    )
    if (family === undefined) continue
    const widths = argument(list, FALLBACK_FACES_PARAMETERS, 'widths') ?? ''
    const ranges = widthBands(widths, context)
    if (ranges === undefined) {
      if (!mixinParameterRead(context, lineIndex, widths))
        collected.unread.push({
          declaration: declarationAt(context, lineIndex),
          kind: 'unread-weights',
          line: lineIndex + 1
        })
      continue
    }
    const style = styleOf(
      argument(list, FALLBACK_FACES_PARAMETERS, 'style'),
      context
    )
    for (const weights of ranges)
      collected.bands.push({ family, style, weights })
  }
}

const readFontFaceRules = (context: Context, collected: FontFaceReading) => {
  for (const { index } of context.code.matchAll(FONT_FACE_RULE)) {
    const body = fontFaceBody(context.code, index)
    const expression = FACE_FAMILY.exec(body)?.[1]
    const isWeb = URL_SOURCE.test(body)
    const isLocal = LOCAL_SOURCE.test(body)
    if (expression === undefined || (!isWeb && !isLocal)) continue
    const lineIndex = lineAt(context.code, index) - 1
    const family = familyOrUnread(context, collected, lineIndex, expression)
    if (family === undefined) continue
    const style = quotedOrBare(FACE_STYLE.exec(body)?.[1] ?? 'normal')
    if (isWeb) collected.faces.push({ family, style })
    else if (FALLBACK_SUFFIX.test(family)) {
      const weights = weightRange(FACE_WEIGHT.exec(body)?.[1] ?? 'normal')
      if (weights)
        collected.bands.push({
          family: family.replace(FALLBACK_SUFFIX, ''),
          style,
          weights
        })
    }
  }
}

const contextOf = (source: string): Context => {
  const code = withoutComments(source)
  return {
    blocks: enclosingBlocks(code),
    code,
    lines: source.split('\n'),
    variables: readVariables(code)
  }
}

/**
 * Reads the faces a stylesheet declares — `fonts.font-face` and
 * `fonts.fallback-faces` includes, `@font-face` rules — resolving a family
 * held in a variable the same file assigns once. A face inside a mixin that
 * takes its family as a parameter is the app's own face mixin; any other
 * family or weight map it cannot read is `unread`.
 */
export const readFontFaces = (source: string): FontFaceReading => {
  const context = contextOf(source)
  const collected: FontFaceReading = {
    bands: [],
    faces: [],
    mixins: [],
    unread: []
  }
  readFontFaceCalls(context, collected)
  readFallbackFacesCalls(context, collected)
  readFontFaceRules(context, collected)
  return collected
}

/** The families passed to the app's own face mixins, in a source that includes them. */
export const familiesThroughMixins = (
  source: string,
  mixins: readonly FaceMixin[]
): string[] => {
  const context = contextOf(source)
  return mixins.flatMap((mixin) => {
    const include = new RegExp(
      String.raw`(?:@include\s+|^\s*\+)(?:[\w-]+\.)?${mixin.name}\(`,
      'gm'
    )
    return [...context.code.matchAll(include)].flatMap(({ 0: call, index }) => {
      const list = readArguments(context.code, index + call.length - 1)
      const expression =
        list.named.get(mixin.parameter) ?? list.positional[mixin.position]
      const family =
        expression === undefined
          ? undefined
          : resolveName(expression, context.variables)
      return family === undefined ? [] : [family]
    })
  })
}
