import { Result } from '@adrienlcp/result'

import type { Locale } from '@/presentation/i18n/locale'

/**
 * Written by the prerender beside the documents, so it is served from the
 * site's own origin and only exists in a build: a dev server has no index.
 */
const PAGEFIND_MODULE = '/pagefind/pagefind.js'

/** Words each excerpt shows around a match: one line of the dialog, two on a phone. */
const EXCERPT_WORDS = 22

/** Long enough to skip the words of a query typed fast, short enough to read as live. */
const TYPING_PAUSE_MS = 120

type PagefindAnchor = {
  element: string
  id: string
}

export type PagefindSubResult = {
  anchor?: PagefindAnchor
  /** HTML: the page's words, escaped, each match in a `<mark>`. */
  excerpt: string
  title: string
  url: string
}

export type PagefindDocument = {
  excerpt: string
  meta: { title?: string }
  sub_results: readonly PagefindSubResult[]
  url: string
}

type PagefindSearch = {
  results: readonly { data: () => Promise<PagefindDocument>; id: string }[]
}

type PagefindInstance = {
  debouncedSearch: (
    term: string,
    options: object,
    debounceTimeoutMs: number
  ) => Promise<PagefindSearch | null>
  init: () => Promise<void>
  options: (options: { excerptLength: number }) => Promise<void>
}

type PagefindModule = {
  createInstance: () => PagefindInstance
}

const isPagefindModule = (module: unknown): module is PagefindModule =>
  typeof module === 'object' &&
  module !== null &&
  'createInstance' in module &&
  typeof module.createInstance === 'function'

const loadPagefind = async (): Promise<Result<PagefindModule, 'missing'>> => {
  try {
    const module: unknown = await import(/* @vite-ignore */ PAGEFIND_MODULE)

    return isPagefindModule(module)
      ? Result.success(module)
      : Result.failure('missing')
  } catch {
    return Result.failure('missing')
  }
}

/**
 * One per locale: Pagefind picks its index from `<html lang>` when an instance
 * is created, and keeps it.
 */
const instances = new Map<Locale, Promise<PagefindInstance | null>>()

const createInstanceFor = async (): Promise<PagefindInstance | null> => {
  const pagefind = await loadPagefind()

  if (pagefind.status === 'failure') {
    return null
  }

  const instance = pagefind.data.createInstance()

  await instance.options({ excerptLength: EXCERPT_WORDS })
  await instance.init()

  return instance
}

/** Created while `<html lang>` names `locale`, the only time Pagefind reads it. */
const instanceFor = (locale: Locale): Promise<PagefindInstance | null> => {
  const known = instances.get(locale)

  if (known !== undefined) {
    return known
  }

  const created = createInstanceFor().catch(() => null)

  instances.set(locale, created)

  return created
}

/** Starts downloading the index of `locale`, so the first query does not wait for it. */
export const preloadSearchIndex = async (
  locale: Locale
): Promise<Result<void, 'unavailable'>> =>
  (await instanceFor(locale)) === null
    ? Result.failure('unavailable')
    : Result.success()

/**
 * The documents of `locale` matching `query`, best first; `superseded` when a
 * later query arrived before this one ran.
 */
export const searchDocuments = async ({
  limit,
  locale,
  query
}: {
  limit: number
  locale: Locale
  query: string
}): Promise<
  Result<readonly PagefindDocument[], 'superseded' | 'unavailable'>
> => {
  const instance = await instanceFor(locale)

  if (instance === null) {
    return Result.failure('unavailable')
  }

  try {
    const search = await instance.debouncedSearch(query, {}, TYPING_PAUSE_MS)

    if (search === null) {
      return Result.failure('superseded')
    }

    return Result.success(
      await Promise.all(
        search.results.slice(0, limit).map((result) => result.data())
      )
    )
  } catch {
    return Result.failure('unavailable')
  }
}
