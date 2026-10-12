import { describe, expect, it } from 'vitest'

import { addFontPreloads } from './font-preloads.ts'
import { createElement, insertIntoHead } from './html-document.ts'
import { headTags, parseShell } from './shell.fixture.ts'

const FACES = [
  '@font-face{font-family:Body;src:url(/fonts/body-latin.woff2)}',
  '@font-face{font-family:Display;src:url(/fonts/display-latin.woff2)}'
].join('')

const PRELOADED_URL = /.*href=(\S+).*/

const preloadedUrlsOf = (document: Document): string[] =>
  headTags(document)
    .filter((tag) => tag.includes('rel=preload'))
    .map((tag) => tag.replace(PRELOADED_URL, '$1'))

describe('font preload selection', () => {
  it('preloads nothing for none', () => {
    const document = parseShell()

    addFontPreloads({ css: FACES, document, include: 'none' })

    expect(preloadedUrlsOf(document)).toEqual([])
  })

  it('preloads in the order the patterns are listed, each face once', () => {
    const document = parseShell()

    addFontPreloads({
      css: FACES,
      document,
      include: [/display-latin/, /-latin\.woff2$/]
    })

    expect(preloadedUrlsOf(document)).toEqual([
      '/fonts/display-latin.woff2',
      '/fonts/body-latin.woff2'
    ])
  })

  it('goes ahead of a preload the page already asked for', () => {
    const document = parseShell()

    insertIntoHead({
      document,
      elements: [
        createElement({
          attributes: { as: 'image', href: '/hero.avif', rel: 'preload' },
          document,
          tagName: 'link'
        })
      ]
    })
    addFontPreloads({ css: FACES, document })

    expect(preloadedUrlsOf(document)).toEqual([
      '/fonts/body-latin.woff2',
      '/fonts/display-latin.woff2',
      '/hero.avif'
    ])
  })
})
