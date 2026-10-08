import { describe, expect, it } from 'vitest'

import {
  noindexShell,
  originOfCanonical,
  setMetaContents,
  setTitle
} from './head-tags.ts'
import {
  createElement,
  insertIntoHead,
  onlyElement,
  serializeDocument
} from './html-document.ts'
import { htmlFileForPath } from './html-file-for-path.ts'
import { headTags, parseShell, SHELL_HTML } from './shell.fixture.ts'
import { appendStructuredData } from './structured-data.ts'

describe('html document', () => {
  it('prints the document back as it read it', () => {
    expect(serializeDocument(parseShell())).toBe(SHELL_HTML)
  })

  it('refuses a title that would read back as another text', () => {
    const document = parseShell()

    setTitle({ document, title: 'Fish &amp; chips' })

    expect(() => serializeDocument(document)).toThrow(/does not read back/)
  })

  it('names a selector that matches no element, or several', () => {
    const document = parseShell()

    expect(() => onlyElement({ document, selector: 'main' })).toThrow(
      'main matched 0 elements, expected 1'
    )
    expect(() => onlyElement({ document, selector: 'head > meta' })).toThrow(
      'head > meta matched 3 elements, expected 1'
    )
  })

  it('writes a bare attribute for true', () => {
    const document = parseShell()

    insertIntoHead({
      document,
      elements: [
        createElement({
          attributes: { crossorigin: true, href: '/a.woff2', rel: 'preload' },
          document,
          tagName: 'link'
        })
      ]
    })

    expect(headTags(document).at(-2)).toBe(
      'link crossorigin= href=/a.woff2 rel=preload'
    )
  })
})

describe('head tags', () => {
  it('sets the title and every named meta', () => {
    const document = parseShell()

    setTitle({ document, title: 'Home' })
    setMetaContents({
      document,
      metaContents: {
        'name="description"': 'A page',
        'property="og:locale"': 'fr_FR'
      }
    })

    expect(document.title).toBe('Home')
    expect(headTags(document)).toContain('meta content=A page name=description')
    expect(headTags(document)).toContain(
      'meta content=fr_FR property=og:locale'
    )
  })

  it('reads the origin off the canonical link', () => {
    expect(originOfCanonical(parseShell())).toBe('https://example.com')
  })

  it('marks the not-found shell noindex', () => {
    const document = parseShell()

    noindexShell(document)

    expect(headTags(document).at(-1)).toBe('meta content=noindex name=robots')
  })
})

describe('structured data', () => {
  it('escapes what would close the script tag', () => {
    const document = parseShell()

    appendStructuredData({ data: { name: '</script>' }, document })

    const script = onlyElement({
      document,
      selector: 'script[type="application/ld+json"]'
    })

    expect(script.textContent).toBe('{"name":"\\u003c/script>"}')
    expect(JSON.parse(script.textContent ?? '')).toEqual({ name: '</script>' })
  })
})

describe('html file for path', () => {
  it.each([
    ['/', 'index.html'],
    ['/en', 'en.html'],
    ['/fr/about', 'fr/about.html'],
    ['/docs/', 'docs/index.html']
  ])('writes %s to %s', (path, file) => {
    expect(htmlFileForPath(path)).toBe(file)
  })

  it('refuses a relative path', () => {
    expect(() => htmlFileForPath('en')).toThrow('not a path from the site root')
  })
})
