import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { Result } from '@adrienlcp/result'

export type DictionaryFailure = 'unreadable' | 'unsupported'

const PLACEHOLDER = /\{[^{}]*\}/g
const RICH_TEXT_TAG = /<\/?[A-Za-z][\w-]*>/g
const PLURAL_SETTINGS = new Set(['formatter', 'type'])
const MODULE_EXTENSIONS = new Set(['.js', '.mjs', '.mts', '.ts'])

/** A message as it shows, its `{placeholders}` and `<tags>` left out: their values are the app's, not the dictionary's. */
export const messageText = (message: string): string =>
  message.replace(PLACEHOLDER, '').replace(RICH_TEXT_TAG, '')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringsOf = (value: unknown): string[] =>
  isRecord(value)
    ? Object.values(value).filter((each) => typeof each === 'string')
    : []

const pluralFormsOf = (forms: unknown) =>
  isRecord(forms)
    ? Object.entries(forms).flatMap(([form, text]) =>
        PLURAL_SETTINGS.has(form) || typeof text !== 'string' ? [] : [text]
      )
    : []

const alternativesOf = (options: unknown): string[] =>
  isRecord(options)
    ? [
        ...Object.values(
          isRecord(options.plural) ? options.plural : {}
        ).flatMap(pluralFormsOf),
        ...Object.values(isRecord(options.enum) ? options.enum : {}).flatMap(
          stringsOf
        )
      ]
    : []

const isDefinedTranslation = (
  value: readonly unknown[]
): value is readonly [string, unknown] =>
  value.length === 2 && typeof value[0] === 'string' && isRecord(value[1])

/**
 * Every message of a dictionary tree, as it shows: a string leaf, a
 * `defineTranslation` pair's message and its plural forms and enum members
 * from `@adrienlcp/i18n`, the strings of any other JSON tree.
 */
export const dictionaryMessages = (tree: unknown): string[] => {
  if (typeof tree === 'string') return [messageText(tree)]
  if (Array.isArray(tree))
    return isDefinedTranslation(tree)
      ? [tree[0], ...alternativesOf(tree[1])].map(messageText)
      : tree.flatMap(dictionaryMessages)
  return isRecord(tree) ? Object.values(tree).flatMap(dictionaryMessages) : []
}

const loadTree = async (path: string): Promise<unknown> => {
  if (extname(path) === '.json') return JSON.parse(readFileSync(path, 'utf8'))
  const module: Record<string, unknown> = await import(
    pathToFileURL(resolve(path)).href
  )
  return module.default ?? module
}

/**
 * The messages of a dictionary file, one per line: a `.json` tree, or a
 * `.ts`/`.js` module whose default export — else every export — is one, as
 * Node imports it.
 */
export const readDictionaryText = async (
  path: string
): Promise<Result<string, DictionaryFailure>> => {
  const extension = extname(path)
  if (extension !== '.json' && !MODULE_EXTENSIONS.has(extension))
    return Result.failure('unsupported')
  try {
    return Result.success(dictionaryMessages(await loadTree(path)).join('\n'))
  } catch {
    return Result.failure('unreadable')
  }
}
