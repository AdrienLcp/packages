import { readFileSync } from 'node:fs'

import { Result } from '@adrienlcp/result'
import { z } from 'zod'

import type { EdgeLine } from './line-bounds.ts'

export type EdgeLinesFailure = 'unreadable' | 'malformed'

const edgeLineSchema = z.object({
  box: z.number().positive(),
  fontSize: z.number().positive(),
  letterSpacing: z.number().optional(),
  text: z.string().min(1),
  weight: z.number().positive().optional()
})

const edgeLinesSchema = z.array(edgeLineSchema).min(1)

/**
 * The edge lines of a `--lines` file: a JSON array of `{ text, box,
 * fontSize, weight?, letterSpacing? }`, the box's content width and the font
 * size in px as DevTools shows them, the letter spacing in em. The box comes
 * back in em of the font size.
 */
export const parseEdgeLines = (
  json: unknown
): Result<EdgeLine[], 'malformed'> => {
  const parsed = edgeLinesSchema.safeParse(json)
  if (!parsed.success) return Result.failure('malformed')
  return Result.success(
    parsed.data.map(({ box, fontSize, ...line }) => ({
      ...line,
      box: box / fontSize
    }))
  )
}

/** Reads and parses a `--lines` file. */
export const readEdgeLines = (
  path: string
): Result<EdgeLine[], EdgeLinesFailure> => {
  try {
    return parseEdgeLines(JSON.parse(readFileSync(path, 'utf8')))
  } catch {
    return Result.failure('unreadable')
  }
}
