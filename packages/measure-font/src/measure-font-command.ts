import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { parseArgs } from 'node:util'

import { Result } from '@adrienlcp/result'

import { type ArialCut, findArialFile } from './arial-files.ts'
import {
  measureFailureMessage,
  textSourceFailureMessage
} from './command-messages.ts'
import { readEdgeLines } from './edge-lines-file.ts'
import { fallbackFacesInclude } from './fallback-faces-include.ts'
import { measureFallbackFaces } from './fallback-measure.ts'
import { openFont } from './font-metrics.ts'
import { measureReport, measureWarnings } from './measure-report.ts'
import { servedFaces } from './served-face.ts'
import { gatherText } from './text-sources.ts'

/** Where the command writes: `process` itself, or a test's capture. */
export type CommandOutput = {
  stdout: { write: (text: string) => unknown }
  stderr: { write: (text: string) => unknown }
}

const USAGE = `Usage: measure-font <font file>... [options]

Measures a self-hosted family against Arial for fonts.fallback-faces, and the
zero's advance in em for converting a ch. List the family's files in the
order its @font-face rules come, the regular first; the unicode-range subsets
of one face are measured as one font.

Where the faces are read:
  --weight <n>         A weight to measure a variable file at; repeat it.
                       Defaults to the axis default. A static file is
                       measured at its own weight.
  --axis <tag>=<n>     Another axis to read a variable file at — wdth=70 for
                       a condensed width, written as $stretch: 70%.
  --italic             Measure italic files, over Arial Italic and Arial Bold
                       Italic.

The text, the app's own — every source given is read:
  --text <text>        A text; repeat it.
  --text-file <path>   A text file. Spaces and newlines collapse as a
                       browser collapses them.
  --text-from <path>   An i18n dictionary: .json, or a .ts or .js module.
  --text-from-dist <dir>
                       The prerendered .html pages under a directory.
  --select <selector>  Reads only the elements of those pages it matches:
                       h1, h2 for the headings' weight.
  --uppercase          Measures the text uppercased, as text-transform
                       shows it.
  --lines <path>       Lines at the edge of their box, as JSON: the ratio
                       range that keeps each wrapped as the web font wraps it.

The digits:
  --figures            Also measure the digits alone, for a figures face of
                       their own.
  --figure-feature <tag>
                       An OpenType feature the digits are set with; repeat
                       it — tnum and lnum for tabular-nums lining-nums. A
                       file without it is refused.
  --figure-separators  Measure : . , with the digits, for
                       $figure-separators.
  --figures-only       Measure the digits alone and print $figures only.

The include:
  --size-adjust <n>    The size-adjust fontaine wrote in the built CSS.
                       Defaults to fontaine's computation from the first
                       file; 1 leaves it to the mixin.
  --ascent <em>, --descent <em>
                       Ascent and descent by hand, over the font's hhea.
  --bold-from <n>      The weight from which a band is drawn in Arial Bold
                       (650, as fallback-faces).
  --family <name>      The family name the stylesheet uses.
  --fallback <path>, --fallback-bold <path>
                       The Arial files, found on this machine by default.`

const DEFAULT_BOLD_FROM = 650
const AXIS_SETTING = /^(?<tag>[A-Za-z]{4})=(?<value>-?\d+(?:\.\d+)?)$/

const OPTIONS = {
  ascent: { type: 'string' },
  axis: { multiple: true, type: 'string' },
  'bold-from': { type: 'string' },
  descent: { type: 'string' },
  fallback: { type: 'string' },
  'fallback-bold': { type: 'string' },
  family: { type: 'string' },
  'figure-feature': { multiple: true, type: 'string' },
  'figure-separators': { type: 'boolean' },
  figures: { type: 'boolean' },
  'figures-only': { type: 'boolean' },
  help: { short: 'h', type: 'boolean' },
  italic: { type: 'boolean' },
  lines: { type: 'string' },
  select: { type: 'string' },
  'size-adjust': { type: 'string' },
  text: { multiple: true, type: 'string' },
  'text-file': { multiple: true, type: 'string' },
  'text-from': { multiple: true, type: 'string' },
  'text-from-dist': { multiple: true, type: 'string' },
  uppercase: { type: 'boolean' },
  weight: { multiple: true, type: 'string' }
} as const

type Values = ReturnType<
  typeof parseArgs<{ options: typeof OPTIONS }>
>['values']

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

const numberOf = (value: string | undefined) =>
  value === undefined ? undefined : Number(value)

const axesOption = (
  settings: readonly string[]
): Result<Record<string, number>, string> => {
  const axes: Record<string, number> = {}
  for (const setting of settings) {
    const groups = AXIS_SETTING.exec(setting)?.groups
    if (groups?.tag === undefined || groups.value === undefined)
      return Result.failure(`--axis ${setting}: write it <tag>=<n>, wdth=70`)
    axes[groups.tag] = Number(groups.value)
  }
  return Result.success(axes)
}

type NumberOptions = {
  ascent?: number
  boldFrom?: number
  descent?: number
  sizeAdjust?: number
  weights: number[]
}

const numberOptions = (values: Values): Result<NumberOptions, string> => {
  const given: [name: string, value: string | undefined][] = [
    ['ascent', values.ascent],
    ['bold-from', values['bold-from']],
    ['descent', values.descent],
    ['size-adjust', values['size-adjust']],
    ...(values.weight ?? []).map((weight): [string, string] => [
      'weight',
      weight
    ])
  ]
  const notANumber = given.find(
    ([, value]) => value !== undefined && !Number.isFinite(Number(value))
  )
  if (notANumber !== undefined)
    return Result.failure(`--${notANumber[0]} ${notANumber[1]}: not a number`)
  return Result.success({
    ascent: numberOf(values.ascent),
    boldFrom: numberOf(values['bold-from']),
    descent: numberOf(values.descent),
    sizeAdjust: numberOf(values['size-adjust']),
    weights: (values.weight ?? []).map(Number)
  })
}

const fail = (output: CommandOutput, message: string) => {
  output.stderr.write(`${message}\n`)
  return 1
}

const openFiles = async (paths: readonly string[], output: CommandOutput) => {
  const files = await Promise.all(
    paths.map(async (path) => ({
      font: await open(path, output),
      name: basename(path)
    }))
  )
  const opened = files.flatMap(({ font, name }) =>
    font === null ? [] : [{ font, name }]
  )
  return opened.length === files.length ? opened : null
}

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
  const numbers = numberOptions(values)
  if (numbers.status === 'failure') return fail(output, numbers.error)
  const axes = axesOption(values.axis ?? [])
  if (axes.status === 'failure') return fail(output, axes.error)

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
  const files = await openFiles(positionals, output)
  if (regular === null || bold === null || files === null) return 1

  const gathered = await gatherText({
    dictionaries: values['text-from'],
    dists: values['text-from-dist'],
    files: values['text-file'],
    select: values.select,
    texts: values.text,
    uppercase: values.uppercase === true
  })
  if (gathered.status === 'failure')
    return fail(output, textSourceFailureMessage(gathered.error))
  const lines =
    values.lines === undefined
      ? Result.success([])
      : readEdgeLines(values.lines)
  if (lines.status === 'failure')
    return fail(
      output,
      `${values.lines}: ${lines.error === 'malformed' ? 'not a JSON array of { text, box, fontSize, weight?, letterSpacing? }' : 'unreadable'}`
    )

  const figuresOnly = values['figures-only'] === true
  const figureSeparators = values['figure-separators'] === true
  const figuresAsked =
    values.figures === true || figuresOnly || figureSeparators
  const { ascent, boldFrom, descent, sizeAdjust, weights } = numbers.data
  const measure = await measureFallbackFaces({
    axes: axes.data,
    bold,
    boldFrom: boldFrom ?? DEFAULT_BOLD_FROM,
    faces: servedFaces(files),
    figures: figuresAsked
      ? {
          features: values['figure-feature'] ?? [],
          only: figuresOnly,
          separators: figureSeparators
        }
      : undefined,
    lines: lines.data,
    metrics: { ascent, descent },
    regular,
    sizeAdjust,
    text: gathered.data.text,
    weights
  })
  if (measure.status === 'failure')
    return fail(output, measureFailureMessage(measure.error))

  const family = values.family ?? files[0]?.font.font.familyName ?? ''
  for (const warning of measureWarnings(measure.data, {
    defaultText: gathered.data.isDefault
  }))
    output.stderr.write(`warning: ${warning}\n`)
  output.stdout.write(
    [
      ...measureReport(measure.data),
      '',
      fallbackFacesInclude(family, measure.data, {
        figureSeparators,
        italic
      }),
      ''
    ].join('\n')
  )
  return 0
}
