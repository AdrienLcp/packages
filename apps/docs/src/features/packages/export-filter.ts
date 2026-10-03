import { type ExportKind, isExportKind } from './export-kind.ts'
import type { HousePackage, PackageExport } from './house-package.ts'

/** What the inventory is narrowed to; the empty filter shows every export. */
export type ExportFilter = {
  /** `null` for every kind. */
  kind: ExportKind | null
  query: string
}

export const EMPTY_FILTER: ExportFilter = { kind: null, query: '' }

/** A package and the exports of it the filter keeps; never empty. */
export type FilteredPackage = {
  exports: readonly PackageExport[]
  housePackage: HousePackage
}

const QUERY_PARAM = 'q'
const KIND_PARAM = 'kind'

const TAG = /<[^>]*>/g

const textOf = (html: string | null): string => (html ?? '').replace(TAG, '')

const normalizedQueryOf = (filter: ExportFilter): string =>
  filter.query.trim().toLowerCase()

export const isFiltering = (filter: ExportFilter): boolean =>
  filter.kind !== null || normalizedQueryOf(filter) !== ''

/** Kept when its kind matches and the query appears in its name, its summary or its package's name. */
const isKept = (
  housePackage: HousePackage,
  packageExport: PackageExport,
  filter: ExportFilter
): boolean => {
  const query = normalizedQueryOf(filter)

  return (
    (filter.kind === null || packageExport.kind === filter.kind) &&
    (query === '' ||
      packageExport.name.toLowerCase().includes(query) ||
      textOf(packageExport.summaryHtml).toLowerCase().includes(query) ||
      housePackage.name.includes(query))
  )
}

/** The packages with at least one export the filter keeps, in the order given. */
export const filterInventory = (
  packages: readonly HousePackage[],
  filter: ExportFilter
): readonly FilteredPackage[] =>
  packages.flatMap((housePackage) => {
    const exports = housePackage.exports.filter((packageExport) =>
      isKept(housePackage, packageExport, filter)
    )

    return exports.length === 0 ? [] : [{ exports, housePackage }]
  })

export const exportCountOf = (
  packages: readonly { exports: readonly unknown[] }[]
): number => packages.reduce((count, { exports }) => count + exports.length, 0)

/** How many exports each kind has across the packages, every kind present even at zero. */
export const kindCountsOf = (
  packages: readonly HousePackage[]
): Readonly<Record<ExportKind, number>> => {
  const countOf = (kind: ExportKind): number =>
    packages.reduce(
      (count, { exports }) =>
        count +
        exports.filter((packageExport) => packageExport.kind === kind).length,
      0
    )

  return {
    component: countOf('component'),
    constant: countOf('constant'),
    file: countOf('file'),
    function: countOf('function'),
    hook: countOf('hook'),
    sass: countOf('sass'),
    type: countOf('type')
  }
}

/** Reads the filter from the URL's query, ignoring a kind it does not know. */
export const exportFilterFrom = (params: URLSearchParams): ExportFilter => {
  const kind = params.get(KIND_PARAM)

  return {
    kind: kind !== null && isExportKind(kind) ? kind : null,
    query: params.get(QUERY_PARAM) ?? ''
  }
}

/** The URL query that holds the filter, leaving out what it does not narrow. */
export const exportFilterParams = (filter: ExportFilter): URLSearchParams => {
  const params = new URLSearchParams()

  if (filter.query !== '') {
    params.set(QUERY_PARAM, filter.query)
  }

  if (filter.kind !== null) {
    params.set(KIND_PARAM, filter.kind)
  }

  return params
}

/** Where the query sits in `text`, to mark it; `null` when it does not appear. */
export const queryMatchIn = (
  text: string,
  filter: ExportFilter
): { after: string; before: string; match: string } | null => {
  const query = normalizedQueryOf(filter)
  const start = query === '' ? -1 : text.toLowerCase().indexOf(query)

  if (start === -1) {
    return null
  }

  const end = start + query.length

  return {
    after: text.slice(end),
    before: text.slice(0, start),
    match: text.slice(start, end)
  }
}
