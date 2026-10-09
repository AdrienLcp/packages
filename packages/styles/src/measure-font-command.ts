import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { parseArgs } from 'node:util'

import { type ArialCut, findArialFile } from './arial-files.ts'
import {
  fallbackFacesInclude,
  measureFallbackFaces,
  measureReport
} from './fallback-measure.ts'
import { openFont } from './font-metrics.ts'

/** Where the command writes: `process` itself, or a test's capture. */
export type CommandOutput = {
  stdout: { write: (text: string) => unknown }
  stderr: { write: (text: string) => unknown }
}

const USAGE = `Usage: measure-font <font file>... [options]

Measures a self-hosted family against Arial for fonts.fallback-faces, and the
zero's advance in em for converting a ch. List the family's files in the
order its @font-face rules come, the regular first.

  --weight <n>         A weight to measure a variable file at; repeat it.
                       Defaults to the axis default. A static file is
                       measured at its own weight.
  --text <text>        The app's own text to measure widths over.
  --text-file <path>   The same, read from a file.
  --size-adjust <n>    The size-adjust fontaine wrote in the built CSS.
                       Defaults to fontaine's computation from the first file.
  --bold-from <n>      The weight from which a band is drawn in Arial Bold
                       (650, as fallback-faces).
  --family <name>      The family name the stylesheet uses.
  --italic             Measure italic files, over Arial Italic and Arial Bold
                       Italic.
  --fallback <path>, --fallback-bold <path>
                       The Arial files, found on this machine by default.`

const DEFAULT_TEXT =
  'The quick brown fox jumps over the lazy dog. Portez ce vieux whisky au juge blond qui fume : 0123456789, 12 % — « déjà vu » !'
const DEFAULT_BOLD_FROM = 650

const OPTIONS = {
  'bold-from': { type: 'string' },
  fallback: { type: 'string' },
  'fallback-bold': { type: 'string' },
  family: { type: 'string' },
  help: { short: 'h', type: 'boolean' },
  italic: { type: 'boolean' },
  'size-adjust': { type: 'string' },
  text: { type: 'string' },
  'text-file': { type: 'string' },
  weight: { multiple: true, type: 'string' }
} as const

const open = async (path: string, output: CommandOutput) => {
  if (!existsSync(path)) {
    output.stderr.write(`${path}: no such file\n`)
    return null
  }
  const opened = await openFont(readFileSync(path))
  if (opened.status === 'success') return opened.data
  const reason =
    opened.error === 'collection' ? 'a font collection' : 'not a font file'
  output.stderr.write(`${path}: ${reason}\n`)
  return null
}

const openArial = (
  cut: ArialCut,
  given: string | undefined,
  output: CommandOutput
) => {
  const path = given ?? findArialFile(cut)
  if (path !== null) return open(path, output)
  output.stderr.write(`No ${cut} Arial on this machine: pass its file.\n`)
  return Promise.resolve(null)
}

const optionalNumber = (value: string | undefined) =>
  value === undefined ? undefined : Number(value)

/** Runs `measure-font` on its arguments; resolves to the exit code. */
export const measureFontCommand = async (
  args: string[],
  output: CommandOutput
): Promise<number> => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args,
    options: OPTIONS
  })
  if (values.help || positionals.length === 0) {
    output.stdout.write(`${USAGE}\n`)
    return values.help ? 0 : 1
  }

  const italic = values.italic === true
  const regular = await openArial(
    italic ? 'italic' : 'regular',
    values.fallback,
    output
  )
  const bold = await openArial(
    italic ? 'bold-italic' : 'bold',
    values['fallback-bold'],
    output
  )
  const files = await Promise.all(
    positionals.map(async (path) => ({
      font: await open(path, output),
      name: basename(path)
    }))
  )
  if (regular === null || bold === null) return 1
  const opened = files.flatMap(({ font, name }) =>
    font === null ? [] : [{ font, name }]
  )
  if (opened.length < files.length) return 1

  const text =
    values.text ??
    (values['text-file'] === undefined
      ? DEFAULT_TEXT
      : readFileSync(values['text-file'], 'utf8'))
  const measure = await measureFallbackFaces({
    bold,
    boldFrom: optionalNumber(values['bold-from']) ?? DEFAULT_BOLD_FROM,
    files: opened,
    regular,
    sizeAdjust: optionalNumber(values['size-adjust']),
    text,
    weights: (values.weight ?? []).map(Number)
  })
  const family = values.family ?? opened[0]?.font.font.familyName
  if (measure === null || family === undefined) return 1

  output.stdout.write(
    [
      ...measureReport(measure),
      '',
      fallbackFacesInclude(family, measure, { italic }),
      ''
    ].join('\n')
  )
  return 0
}
