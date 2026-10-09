import { existsSync, readFileSync } from 'node:fs'

import { Result } from '@adrienlcp/result'

import { readDictionaryText } from './dictionary-text.ts'
import { readDistText } from './dist-text.ts'
import { asShown, DEFAULT_TEXT } from './measured-text.ts'

/** Where the text to measure comes from; every source given is read, one after the other. */
export type TextSources = {
  texts?: readonly string[]
  files?: readonly string[]
  /** i18n dictionaries: `.json`, or `.ts`/`.js` modules. */
  dictionaries?: readonly string[]
  /** Directories of prerendered `.html` pages. */
  dists?: readonly string[]
  /** Reads only the elements of a page this selector matches. */
  select?: string
  /** Measures the text as `text-transform: uppercase` shows it. */
  uppercase?: boolean
}

/** The text gathered, and whether it is the default pangram because no source was given. */
export type GatheredText = { text: string; isDefault: boolean }

/** Why a source could not be read. */
export type TextSourceFailure =
  | { reason: 'missing'; path: string }
  | { reason: 'unsupported-dictionary'; path: string }
  | { reason: 'unreadable-dictionary'; path: string }
  | { reason: 'no-html'; path: string }
  | { reason: 'bad-selector'; select: string }

type SourceKind = 'file' | 'dictionary' | 'dist'

const readDictionary = async (
  path: string
): Promise<Result<string, TextSourceFailure>> => {
  const read = await readDictionaryText(path)
  if (read.status === 'success') return read
  return Result.failure({
    path,
    reason:
      read.error === 'unsupported'
        ? 'unsupported-dictionary'
        : 'unreadable-dictionary'
  })
}

const readDist = (
  path: string,
  select: string | undefined
): Result<string, TextSourceFailure> => {
  const read = readDistText(path, select)
  if (read.status === 'success') return read
  return Result.failure(
    read.error === 'no-html'
      ? { path, reason: 'no-html' }
      : { reason: 'bad-selector', select: select ?? '' }
  )
}

const readSource = async (
  kind: SourceKind,
  path: string,
  select: string | undefined
): Promise<Result<string, TextSourceFailure>> => {
  if (!existsSync(path)) return Result.failure({ path, reason: 'missing' })
  if (kind === 'file') return Result.success(readFileSync(path, 'utf8'))
  return kind === 'dictionary' ? readDictionary(path) : readDist(path, select)
}

/**
 * Reads every text source, in the order texts, files, dictionaries, dists,
 * one per line, uppercased when asked. The default pangram when none is
 * given.
 */
export const gatherText = async ({
  dictionaries = [],
  dists = [],
  files = [],
  select,
  texts = [],
  uppercase = false
}: TextSources): Promise<Result<GatheredText, TextSourceFailure>> => {
  const sources = [
    ...files.map((path): [SourceKind, string] => ['file', path]),
    ...dictionaries.map((path): [SourceKind, string] => ['dictionary', path]),
    ...dists.map((path): [SourceKind, string] => ['dist', path])
  ]
  const read: string[] = [...texts]
  for (const [kind, path] of sources) {
    const text = await readSource(kind, path, select)
    if (text.status === 'failure') return text
    read.push(text.data)
  }
  const isDefault = read.length === 0
  const text = isDefault ? DEFAULT_TEXT : read.join('\n')
  return Result.success({ isDefault, text: asShown(text, { uppercase }) })
}
