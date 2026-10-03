import { describe, expect, it } from 'vitest'

import { exportsBySection } from '@/features/package-pages/exports-by-section'
import type {
  DocumentSection,
  PackageExport
} from '@/features/packages/house-package'

const documentSectionOf = (slug: string): DocumentSection => ({
  file: 'README.md',
  html: '',
  slug,
  titleHtml: slug
})

const exportIn = (name: string, slug: string | null): PackageExport => ({
  kind: 'function',
  name,
  section: slug === null ? null : { file: 'README.md', slug, titleHtml: slug },
  specifier: '@adrienlcp/x',
  summaryHtml: null
})

describe('exportsBySection', () => {
  it('[exports-by-section] groups the exports under the section that explains them, in the order the documentation reads', () => {
    const documentation = [
      documentSectionOf('install'),
      documentSectionOf('usage')
    ]
    const exports = [
      exportIn('late', 'usage'),
      exportIn('early', 'install'),
      exportIn('later', 'usage')
    ]

    expect(
      exportsBySection({ documentation, exports }).map(
        ({ exports: grouped, section }) => [
          section?.slug,
          grouped.map(({ name }) => name)
        ]
      )
    ).toEqual([
      ['install', ['early']],
      ['usage', ['late', 'later']]
    ])
  })

  it('[exports-by-section] puts the exports no section names last, under a null section', () => {
    const documentation = [documentSectionOf('usage')]
    const exports = [exportIn('orphan', null), exportIn('named', 'usage')]

    expect(exportsBySection({ documentation, exports })).toEqual([
      { exports: [exports[1]], section: exports[1]?.section },
      { exports: [exports[0]], section: null }
    ])
  })

  it('[exports-by-section] leaves out a section no export belongs to', () => {
    const documentation = [
      documentSectionOf('empty'),
      documentSectionOf('usage')
    ]
    const exports = [exportIn('named', 'usage')]

    expect(
      exportsBySection({ documentation, exports }).map(
        ({ section }) => section?.slug
      )
    ).toEqual(['usage'])
  })

  it('[exports-by-section] adds no null group when every export has a section', () => {
    const documentation = [documentSectionOf('usage')]

    expect(
      exportsBySection({ documentation, exports: [exportIn('named', 'usage')] })
    ).toHaveLength(1)
  })

  it('[exports-by-section] answers nothing for no export', () => {
    expect(
      exportsBySection({
        documentation: [documentSectionOf('usage')],
        exports: []
      })
    ).toEqual([])
  })
})
