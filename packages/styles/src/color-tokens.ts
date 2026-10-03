import { Result } from '@adrienlcp/result'

import { type Color, parseColor } from './color.ts'

export type ColorScheme = 'dark' | 'light'

export type TokenError =
  | 'circular-reference'
  | 'declared-twice'
  | 'undeclared'
  | 'unsupported-color'

/** Every custom property a stylesheet declares, with each value it is given. */
export type TokenDeclarations = ReadonlyMap<string, readonly string[]>

const DECLARATION_PATTERN = /(--[\w-]+)\s*:\s*([^;\n}]+)/g
const COMMENT_PATTERN = /\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm
const VAR_PATTERN = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/
const LIGHT_DARK_PATTERN = /^light-dark\((.+)\)$/

/** Reads the custom properties of a `.css` or indented `.sass` source. */
export const readTokenDeclarations = (
  stylesheet: string
): TokenDeclarations => {
  const declarations = new Map<string, string[]>()

  for (const [, name = '', value = ''] of stylesheet
    .replace(COMMENT_PATTERN, '')
    .matchAll(DECLARATION_PATTERN)) {
    const values = declarations.get(name) ?? []
    const trimmed = value.trim()
    if (!values.includes(trimmed)) values.push(trimmed)
    declarations.set(name, values)
  }

  return declarations
}

/** Splits `a, b` on its top-level comma, the one no parenthesis encloses. */
const splitArguments = (list: string) => {
  let depth = 0
  for (const [index, character] of [...list].entries()) {
    if (character === '(') depth += 1
    if (character === ')') depth -= 1
    if (character === ',' && depth === 0)
      return [list.slice(0, index).trim(), list.slice(index + 1).trim()]
  }
  return [list.trim()]
}

type Resolution = Result<Color, { error: TokenError; token: string }>

const resolveValue = (
  declarations: TokenDeclarations,
  value: string,
  scheme: ColorScheme,
  token: string,
  visited: ReadonlySet<string>
): Resolution => {
  const reference = value.match(VAR_PATTERN)
  if (reference) {
    const [, name = '', fallback] = reference
    if (!declarations.has(name) && fallback)
      return resolveValue(declarations, fallback, scheme, token, visited)
    return resolveToken(declarations, name, scheme, visited)
  }

  const lightDark = value.match(LIGHT_DARK_PATTERN)
  if (lightDark?.[1]) {
    const [light = '', dark = light] = splitArguments(lightDark[1])
    const chosen = scheme === 'light' ? light : dark
    return resolveValue(declarations, chosen, scheme, token, visited)
  }

  const color = parseColor(value)
  if (color.status === 'failure')
    return Result.failure({ error: color.error, token })
  return color
}

/** The colour a token paints in one scheme, following `var()` and `light-dark()`. */
export const resolveToken = (
  declarations: TokenDeclarations,
  token: string,
  scheme: ColorScheme,
  visited: ReadonlySet<string> = new Set()
): Resolution => {
  if (visited.has(token))
    return Result.failure({ error: 'circular-reference', token })

  const values = declarations.get(token)
  if (!values) return Result.failure({ error: 'undeclared', token })

  const [value] = values
  if (values.length > 1 || value === undefined)
    return Result.failure({ error: 'declared-twice', token })

  return resolveValue(
    declarations,
    value,
    scheme,
    token,
    new Set([...visited, token])
  )
}
