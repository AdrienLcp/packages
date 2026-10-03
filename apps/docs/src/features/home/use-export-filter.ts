import { useState } from 'react'

import {
  EMPTY_FILTER,
  type ExportFilter,
  exportFilterFrom,
  exportFilterParams
} from '@/features/packages/export-filter'
import type { ExportKind } from '@/features/packages/export-kind'
import {
  useQueryParams,
  useReplaceQueryParams
} from '@/infrastructure/router/navigation'

/**
 * The inventory's filter, kept in the URL so a filtered view can be shared and
 * the sidebar can follow it. The field's text is held here too, so typing is
 * never slowed by the navigation that writes it to the URL; a change of URL
 * from elsewhere, such as the sidebar's "Every export", wins over it.
 */
export const useExportFilter = () => {
  const urlFilter = exportFilterFrom(useQueryParams())
  const replaceQueryParams = useReplaceQueryParams()
  const [query, setQuery] = useState(urlFilter.query)
  const [lastUrlQuery, setLastUrlQuery] = useState(urlFilter.query)

  if (urlFilter.query !== lastUrlQuery) {
    setLastUrlQuery(urlFilter.query)
    setQuery(urlFilter.query)
  }

  const filter: ExportFilter = { kind: urlFilter.kind, query }

  const applyFilter = (next: ExportFilter): void => {
    setQuery(next.query)
    replaceQueryParams(exportFilterParams(next))
  }

  return {
    clearFilter: () => applyFilter(EMPTY_FILTER),
    filter,
    setKind: (kind: ExportKind | null) => applyFilter({ ...filter, kind }),
    setQuery: (nextQuery: string) =>
      applyFilter({ ...filter, query: nextQuery })
  }
}
