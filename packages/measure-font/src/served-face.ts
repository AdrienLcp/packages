import {
  type OpenedFont,
  type TextStyle,
  textWidth,
  type VariationAxis
} from './font-metrics.ts'

/** One file of the family, as the app serves it. */
export type ServedFile = { name: string; font: OpenedFont }

/**
 * One face of a family — a weight or a weight axis, a style, the same other
 * axes — served as one file or as several `unicode-range` subsets of it, which
 * a browser draws as one font: each character from the subset that has it.
 */
export type ServedFace = {
  /** The files' names, joined by ` + `. */
  name: string
  files: readonly ServedFile[]
  family: string
  italic: boolean
  /** The static weight, or the axis default. */
  weight: number
  weightAxis: VariationAxis | null
  axes: Readonly<Record<string, VariationAxis>>
}

/** Which file of a face draws which part of a text. */
export type Coverage = {
  /** The text without the characters no file of the face draws. */
  drawn: string
  /** Runs of the drawn text, each in the first file that has every character of it. */
  runs: readonly { file: ServedFile; text: string }[]
  /** The characters no file draws, once each, in order of appearance. */
  missing: readonly string[]
  /** The files that draw none of the text. */
  unused: readonly string[]
}

const faceKeyOf = ({ font }: ServedFile) =>
  JSON.stringify([
    font.font.familyName,
    font.italic,
    font.weightAxis === null ? font.weight : null,
    Object.entries(font.axes).toSorted(([first], [second]) =>
      first.localeCompare(second)
    )
  ])

const faceOf = (first: ServedFile, files: ServedFile[]): ServedFace => ({
  axes: first.font.axes,
  family: first.font.font.familyName,
  files,
  italic: first.font.italic,
  name: files.map(({ name }) => name).join(' + '),
  weight: first.font.weight,
  weightAxis: first.font.weightAxis
})

/**
 * The faces the files make up, in the order their first file comes: files of
 * one family, style, weight and axes are subsets of one face.
 */
export const servedFaces = (files: readonly ServedFile[]): ServedFace[] =>
  [...Map.groupBy(files, faceKeyOf).values()].flatMap((group) => {
    const [first] = group
    return first === undefined ? [] : [faceOf(first, group)]
  })

const fileDrawing = (face: ServedFace, character: string) => {
  const codePoint = character.codePointAt(0) ?? 0
  return face.files.find(({ font }) =>
    font.font.hasGlyphForCodePoint(codePoint)
  )
}

/** Splits `text` into runs by the file of `face` that draws each character. */
export const coverageOf = (face: ServedFace, text: string): Coverage => {
  const runs: { file: ServedFile; text: string }[] = []
  const missing = new Set<string>()
  for (const character of text) {
    const file = fileDrawing(face, character)
    const last = runs.at(-1)
    if (file === undefined) missing.add(character)
    else if (last?.file === file) last.text += character
    else runs.push({ file, text: character })
  }
  const used = new Set(runs.map(({ file }) => file))
  return {
    drawn: runs.map((run) => run.text).join(''),
    missing: [...missing],
    runs,
    unused: face.files.filter((file) => !used.has(file)).map(({ name }) => name)
  }
}

/**
 * The width of `text` in em in `face`, each run shaped in the file that draws
 * it, as a browser sets a text across `unicode-range` subsets. A character no
 * file draws is left out: the next font of the stack draws it in either face.
 */
export const servedTextWidth = (
  face: ServedFace,
  text: string,
  style: TextStyle = {}
): number =>
  coverageOf(face, text).runs.reduce(
    (width, run) => width + textWidth(run.file.font, run.text, style),
    0
  )
