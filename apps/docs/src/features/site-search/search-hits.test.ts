import { describe, expect, it } from 'vitest'

import type { PagefindDocument } from '@/infrastructure/search/pagefind-index'

import { excerptPartsOf, searchHitOf, servedPathOf } from './search-hits'

const PACKAGE_NAMES = new Set(['i18n', 'styles'])

const documentOf = (
  overrides: Partial<PagefindDocument> = {}
): PagefindDocument => ({
  excerpt: 'the <mark>tokens</mark> of a site',
  meta: { title: '@adrienlcp/styles' },
  sub_results: [],
  url: '/en/styles.html',
  ...overrides
})

describe('servedPathOf', () => {
  it('[search] links to the page the site serves, not the file Pagefind read', () => {
    expect(servedPathOf('/fr/i18n.html')).toBe('/fr/i18n')
    expect(servedPathOf('/fr/i18n.html#plural-rules')).toBe(
      '/fr/i18n#plural-rules'
    )
  })

  it('[search] leaves a path without an extension as it is', () => {
    expect(servedPathOf('/en/legal')).toBe('/en/legal')
  })
})

describe('excerptPartsOf', () => {
  it('[search] marks the words the query matched', () => {
    expect(excerptPartsOf('a <mark>ring</mark> token')).toEqual([
      { isMatch: false, start: 0, text: 'a ' },
      { isMatch: true, start: 2, text: 'ring' },
      { isMatch: false, start: 6, text: ' token' }
    ])
  })

  it('[search] shows escaped markup as the text it was', () => {
    expect(excerptPartsOf('&lt;<mark>Main</mark>&gt;')).toEqual([
      { isMatch: false, start: 0, text: '<' },
      { isMatch: true, start: 1, text: 'Main' },
      { isMatch: false, start: 5, text: '>' }
    ])
  })
})

describe('searchHitOf', () => {
  it('[search] names the package a page documents', () => {
    expect(
      searchHitOf({ document: documentOf(), packageNames: PACKAGE_NAMES })
    ).toMatchObject({
      href: '/en/styles',
      packageName: 'styles',
      title: '@adrienlcp/styles'
    })
  })

  it('[search] names no package for a page about none', () => {
    expect(
      searchHitOf({
        document: documentOf({
          meta: { title: 'Legal' },
          url: '/en/legal.html'
        }),
        packageNames: PACKAGE_NAMES
      }).packageName
    ).toBeNull()
  })

  it('[search] shows the page excerpt when Pagefind found no section', () => {
    expect(
      searchHitOf({ document: documentOf(), packageNames: PACKAGE_NAMES })
        .sections
    ).toEqual([
      {
        excerpt: [
          { isMatch: false, start: 0, text: 'the ' },
          { isMatch: true, start: 4, text: 'tokens' },
          { isMatch: false, start: 10, text: ' of a site' }
        ],
        href: '/en/styles',
        title: null
      }
    ])
  })

  it('[search] links each section to its anchor, the most matches first, three at most', () => {
    const subResult = (id: string, excerpt: string) => ({
      anchor: { element: 'h3', id },
      excerpt,
      title: id,
      url: `/en/styles.html#${id}`
    })
    const { sections } = searchHitOf({
      document: documentOf({
        sub_results: [
          subResult('one', '<mark>a</mark>'),
          subResult('three', '<mark>a</mark> <mark>a</mark> <mark>a</mark>'),
          subResult('two', '<mark>a</mark> <mark>a</mark>'),
          subResult('none', 'a')
        ]
      }),
      packageNames: PACKAGE_NAMES
    })

    expect(sections.map(({ href }) => href)).toEqual([
      '/en/styles#three',
      '/en/styles#two',
      '/en/styles#one'
    ])
  })

  it('[search] sends the text above the first section to the page itself', () => {
    const [section] = searchHitOf({
      document: documentOf({
        sub_results: [
          {
            anchor: { element: 'h1', id: 'package-title' },
            excerpt: '<mark>tokens</mark>',
            title: '@adrienlcp/styles',
            url: '/en/styles.html#package-title'
          }
        ]
      }),
      packageNames: PACKAGE_NAMES
    }).sections

    expect(section).toMatchObject({ href: '/en/styles', title: null })
  })
})
