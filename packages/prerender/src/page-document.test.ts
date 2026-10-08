import { describe, expect, it } from 'vitest'

import { onlyElement } from './html-document.ts'
import { writeLanguageVersions } from './language-versions.ts'
import { renderIntoShell } from './rendered-page.ts'
import { headTags, parseShell, SHELL_HTML } from './shell.fixture.ts'

describe('render into shell', () => {
  it('moves what React rendered ahead of the page into the head', () => {
    const document = parseShell()
    const { title } = renderIntoShell({
      document,
      html: '<title>Home</title><meta name="author" content="A"><link rel="preload" as="image" href="/hero.avif"><main><svg><title>Logo</title></svg></main>',
      path: '/en'
    })

    expect(title).toBe('Home')
    expect(document.title).toBe('Home')
    expect(headTags(document).slice(-3)).toEqual([
      'meta content=A name=author',
      'link as=image href=/hero.avif rel=preload',
      'script src=/assets/index.js type=module'
    ])
    expect(onlyElement({ document, selector: '#root' }).innerHTML).toBe(
      '<main><svg><title>Logo</title></svg></main>'
    )
  })

  it.each([
    ['no title', '<main></main>', 0],
    ['two titles', '<title>A</title><title>B</title><main></main>', 2],
    ['a title inside the page', '<main><title>A</title></main>', 1]
  ])('refuses a page with %s', (_, html, count) => {
    expect(() =>
      renderIntoShell({ document: parseShell(), html, path: '/en' })
    ).toThrow(`/en rendered ${count} page <title> elements, expected 1`)
  })

  it('renders into another root when told', () => {
    const document = parseShell(SHELL_HTML.replace('id="root"', 'id="app"'))

    renderIntoShell({
      document,
      html: '<title>Home</title>',
      path: '/',
      rootSelector: '#app'
    })

    expect(document.title).toBe('Home')
  })
})

const VERSIONS = [
  { href: 'https://example.com/en', hreflang: 'en', openGraphLocale: 'en_GB' },
  { href: 'https://example.com/fr', hreflang: 'fr', openGraphLocale: 'fr_FR' }
]

describe('language versions', () => {
  it('lists every version, itself included, and the open graph alternates', () => {
    const document = parseShell()

    writeLanguageVersions({
      current: 'https://example.com/fr',
      document,
      versions: VERSIONS,
      xDefault: 'https://example.com/'
    })

    expect(headTags(document)).toEqual([
      'meta charset=utf-8',
      'title',
      'meta content= name=description',
      'meta content=fr_FR property=og:locale',
      'meta content=en_GB property=og:locale:alternate',
      'link href=https://example.com/fr rel=canonical',
      'link href=https://example.com/en hreflang=en rel=alternate',
      'link href=https://example.com/fr hreflang=fr rel=alternate',
      'link href=https://example.com/ hreflang=x-default rel=alternate',
      'link href=/assets/index.css rel=stylesheet',
      'script src=/assets/index.js type=module'
    ])
  })

  it('leaves open graph alone in a shell without it, and x-default out unless given', () => {
    const document = parseShell(
      SHELL_HTML.replace('<meta property="og:locale" content="en_GB">', '')
    )

    writeLanguageVersions({
      current: 'https://example.com/en',
      document,
      versions: VERSIONS
    })

    expect(
      headTags(document).filter((tag) => tag.includes('alternate'))
    ).toEqual([
      'link href=https://example.com/en hreflang=en rel=alternate',
      'link href=https://example.com/fr hreflang=fr rel=alternate'
    ])
  })

  it('refuses a page missing from its own versions', () => {
    expect(() =>
      writeLanguageVersions({
        current: 'https://example.com/de',
        document: parseShell(),
        versions: VERSIONS
      })
    ).toThrow('https://example.com/de is not among its own language versions')
  })
})
