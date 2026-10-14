import { useEffect, useState } from 'react'

import { CATALOGUE } from '@/features/packages/catalogue-content'
import {
  preloadSearchIndex,
  searchDocuments
} from '@/infrastructure/search/pagefind-index'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { type SearchHit, searchHitOf } from './search-hits'

/** Pages listed for one query: enough to scan, few enough to read with the keyboard. */
const PAGES_SHOWN = 8

const PACKAGE_NAMES: ReadonlySet<string> = new Set(
  CATALOGUE.map(({ name }) => name)
)

export type SiteSearchState =
  /** No query yet. */
  | { status: 'idle' }
  /** A query is running; the hits of the one before it stay in place. */
  | { hits: readonly SearchHit[]; query: string; status: 'searching' }
  | { hits: readonly SearchHit[]; query: string; status: 'found' }
  /** The index could not be loaded: a dev server has none, a lost connection neither. */
  | { status: 'unavailable' }

const hitsOf = (state: SiteSearchState): readonly SearchHit[] =>
  state.status === 'found' || state.status === 'searching' ? state.hits : []

/**
 * The query typed in the search dialog and the pages it finds, in the
 * locale's own index. Mounted with the dialog, so the index loads when the
 * search opens and never before.
 */
export const useSiteSearch = (): {
  query: string
  setQuery: (query: string) => void
  state: SiteSearchState
} => {
  const { locale } = useI18n()
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SiteSearchState>({ status: 'idle' })
  const trimmed = query.trim()

  useEffect(() => {
    let isCurrent = true

    void preloadSearchIndex(locale).then((loaded) => {
      if (isCurrent && loaded.status === 'failure') {
        setState({ status: 'unavailable' })
      }
    })

    return () => {
      isCurrent = false
    }
  }, [locale])

  useEffect(() => {
    if (trimmed === '') {
      setState((current) =>
        current.status === 'unavailable' ? current : { status: 'idle' }
      )

      return
    }

    let isCurrent = true

    setState((current) =>
      current.status === 'unavailable'
        ? current
        : { hits: hitsOf(current), query: trimmed, status: 'searching' }
    )
    void searchDocuments({ limit: PAGES_SHOWN, locale, query: trimmed }).then(
      (found) => {
        if (!isCurrent) {
          return
        }

        if (found.status === 'success') {
          setState({
            hits: found.data.map((document) =>
              searchHitOf({ document, packageNames: PACKAGE_NAMES })
            ),
            query: trimmed,
            status: 'found'
          })
        } else if (found.error === 'unavailable') {
          setState({ status: 'unavailable' })
        }
      }
    )

    return () => {
      isCurrent = false
    }
  }, [locale, trimmed])

  return { query, setQuery, state }
}
