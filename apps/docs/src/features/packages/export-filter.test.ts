import { describe, expect, it } from 'vitest'

import {
  EMPTY_FILTER,
  type ExportFilter,
  exportFilterFrom,
  exportFilterParams,
  filterInventory,
  isFiltering,
  kindCountsOf,
  queryMatchIn
} from './export-filter.ts'
import type { ExportKind } from './export-kind.ts'
import type { HousePackage, PackageExport } from './house-package.ts'

const exportOf = (
  name: string,
  kind: ExportKind,
  summaryHtml: string | null = null
): PackageExport => ({
  kind,
  name,
  section: null,
  specifier: '@adrienlcp/x',
  summaryHtml
})

const packageOf = (
  name: string,
  exports: readonly PackageExport[]
): HousePackage => ({
  dependsOn: [],
  description: '',
  ecosystem: [],
  exports,
  handPublishedBefore: null,
  install: `pnpm add @adrienlcp/${name}`,
  name,
  pending: [],
  scopedName: `@adrienlcp/${name}`,
  version: '0.1.0',
  versions: []
})

const inventory = [
  packageOf('i18n', [
    exportOf('createI18n', 'function', 'Builds a <code>translator</code>.'),
    exportOf('Locale', 'type')
  ]),
  packageOf('react', [
    exportOf('useLocale', 'hook', 'Reads the current locale.'),
    exportOf('Animate', 'component')
  ]),
  packageOf('styles', [exportOf('gap', 'sass')])
]

const namesIn = (filter: ExportFilter): readonly string[] =>
  filterInventory(inventory, filter).flatMap(({ exports }) =>
    exports.map(({ name }) => name)
  )

describe('filterInventory', () => {
  it('[export-filter] keeps every package and export under the empty filter', () => {
    expect(filterInventory(inventory, EMPTY_FILTER)).toEqual(
      inventory.map((housePackage) => ({
        exports: housePackage.exports,
        housePackage
      }))
    )
  })

  it('[export-filter] keeps the exports of the kind asked, and drops packages left with none', () => {
    expect(
      filterInventory(inventory, { kind: 'hook', query: '' }).map(
        ({ exports, housePackage }) => [
          housePackage.name,
          exports.map(({ name }) => name)
        ]
      )
    ).toEqual([['react', ['useLocale']]])
  })

  it('[export-filter] matches the query in an export name, whatever the case', () => {
    expect(namesIn({ kind: null, query: ' CreateI18n ' })).toEqual([
      'createI18n'
    ])
  })

  it('[export-filter] matches the query in a summary, text only', () => {
    expect(namesIn({ kind: null, query: 'translator' })).toEqual(['createI18n'])
    expect(namesIn({ kind: null, query: 'code' })).toEqual([])
  })

  it('[export-filter] matches the query in the name of the package, keeping all its exports', () => {
    expect(namesIn({ kind: null, query: 'react' })).toEqual([
      'useLocale',
      'Animate'
    ])
  })

  it('[export-filter] combines the kind and the query', () => {
    expect(namesIn({ kind: 'component', query: 'locale' })).toEqual([])
    expect(namesIn({ kind: 'hook', query: 'locale' })).toEqual(['useLocale'])
  })

  it('[export-filter] keeps the packages in the order given', () => {
    expect(
      filterInventory(inventory.toReversed(), EMPTY_FILTER).map(
        ({ housePackage }) => housePackage.name
      )
    ).toEqual(['styles', 'react', 'i18n'])
  })
})

describe('kindCountsOf', () => {
  it('[export-filter] counts the exports of each kind across the packages', () => {
    expect(kindCountsOf(inventory)).toEqual({
      component: 1,
      constant: 0,
      file: 0,
      function: 1,
      hook: 1,
      sass: 1,
      type: 1
    })
  })

  it('[export-filter] counts every kind at zero for no package', () => {
    expect(kindCountsOf([])).toEqual({
      component: 0,
      constant: 0,
      file: 0,
      function: 0,
      hook: 0,
      sass: 0,
      type: 0
    })
  })
})

describe('isFiltering', () => {
  it.each([
    [{ kind: null, query: '' }, false],
    [{ kind: null, query: '   ' }, false],
    [{ kind: 'type', query: '' }, true],
    [{ kind: null, query: 'a' }, true]
  ] satisfies [ExportFilter, boolean][])(
    '[export-filter] says %j is filtering: %s',
    (filter, expected) => {
      expect(isFiltering(filter)).toBe(expected)
    }
  )
})

describe('exportFilterFrom and exportFilterParams', () => {
  it('[export-filter] reads the filter from the query of the URL', () => {
    expect(exportFilterFrom(new URLSearchParams('q=locale&kind=hook'))).toEqual(
      {
        kind: 'hook',
        query: 'locale'
      }
    )
  })

  it('[export-filter] reads an absent or unknown kind as every kind', () => {
    expect(exportFilterFrom(new URLSearchParams('q=a&kind=widget'))).toEqual({
      kind: null,
      query: 'a'
    })
    expect(exportFilterFrom(new URLSearchParams())).toEqual(EMPTY_FILTER)
  })

  it('[export-filter] writes only what narrows into the URL', () => {
    expect(exportFilterParams(EMPTY_FILTER).toString()).toBe('')
    expect(exportFilterParams({ kind: 'sass', query: '' }).toString()).toBe(
      'kind=sass'
    )
    expect(exportFilterParams({ kind: null, query: 'a b' }).toString()).toBe(
      'q=a+b'
    )
  })

  it('[export-filter] gets the same filter back from the URL it wrote', () => {
    const filter: ExportFilter = { kind: 'component', query: 'anim ate' }

    expect(exportFilterFrom(exportFilterParams(filter))).toEqual(filter)
  })
})

describe('queryMatchIn', () => {
  it('[export-filter] splits the text around the query, keeping the text own case', () => {
    expect(
      queryMatchIn('Reads the Locale', { kind: null, query: ' locale ' })
    ).toEqual({
      after: '',
      before: 'Reads the ',
      match: 'Locale'
    })
  })

  it('[export-filter] marks only the first occurrence', () => {
    expect(queryMatchIn('TAXI tax', { kind: null, query: 'x' })).toEqual({
      after: 'I tax',
      before: 'TA',
      match: 'X'
    })
  })

  it.each([
    ['absent', 'zzz'],
    ['empty', '']
  ])(
    '[export-filter] finds no match for a query that is %s',
    (_case, query) => {
      expect(queryMatchIn('Reads the Locale', { kind: null, query })).toBeNull()
    }
  )
})
