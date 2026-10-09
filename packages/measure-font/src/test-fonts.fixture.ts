import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { type OpenedFont, openFont } from './font-metrics.ts'
import { type ServedFace, servedFaces } from './served-face.ts'

/** The path of a font in `test-fonts/`. */
export const testFontPath = (name: string): string =>
  fileURLToPath(new URL(`test-fonts/${name}`, import.meta.url))

/** Opens a font of `test-fonts/`, throwing when it does not open: a broken fixture. */
export const openTestFont = async (name: string): Promise<OpenedFont> => {
  const opened = await openFont(readFileSync(testFontPath(name)))
  if (opened.status === 'failure') throw new Error(`${name}: ${opened.error}`)
  return opened.data
}

/** The one face the fonts of `test-fonts/` named make up. */
export const testFace = async (...names: string[]): Promise<ServedFace> => {
  const files = await Promise.all(
    names.map(async (name) => ({ font: await openTestFont(name), name }))
  )
  const [face] = servedFaces(files)
  if (face === undefined) throw new Error('no face')
  return face
}
