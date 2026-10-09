import { describe, expect, it } from 'vitest'

import { addFontPreloads } from './font-preloads.ts'
import { addCanonical } from './head-tags.ts'
import {
  createElement,
  insertIntoHead,
  serializeDocument
} from './html-document.ts'
import { writeModulePreloads } from './module-preloads.ts'
import { insertScriptAfterRoot, setRootAttributes } from './page-root.ts'
import {
  headTags,
  INDENTED_SHELL_HTML,
  parseShell,
  SHELL_HTML
} from './shell.fixture.ts'

const SHELL_WITHOUT_CANONICAL = SHELL_HTML.replace(
  '<link rel="canonical" href="https://example.com/">',
  ''
)

describe('add canonical', () => {
  it('adds the canonical link and an og:url to a shell without them', () => {
    const document = parseShell(SHELL_WITHOUT_CANONICAL)

    addCanonical({ document, url: 'https://example.com/deputes/PA1' })

    expect(headTags(document).slice(-3)).toEqual([
      'link href=https://example.com/deputes/PA1 rel=canonical',
      'meta content=https://example.com/deputes/PA1 property=og:url',
      'script src=/assets/index.js type=module'
    ])
  })

  it('sets the og:url the shell holds rather than add a second one', () => {
    const document = parseShell(
      SHELL_WITHOUT_CANONICAL.replace(
        '<title>',
        '<meta property="og:url" content=""><title>'
      )
    )

    addCanonical({ document, url: 'https://example.com/a' })

    expect(headTags(document).filter((tag) => tag.includes('og:url'))).toEqual([
      'meta content=https://example.com/a property=og:url'
    ])
  })

  it('refuses a shell that already holds a canonical link', () => {
    expect(() =>
      addCanonical({ document: parseShell(), url: 'https://example.com/a' })
    ).toThrow('already holds a canonical link')
  })
})

describe('page root', () => {
  it('marks the root and sets a script right after it', () => {
    const document = parseShell()

    setRootAttributes({
      attributes: { 'data-prerendered-path': '/en' },
      document
    })
    insertScriptAfterRoot({ document, script: 'document.title' })

    expect(serializeDocument(document)).toContain(
      '<div data-prerendered-path="/en" id="root"></div><script>document.title</script></body>'
    )
  })

  it('refuses a script that would close its own tag', () => {
    expect(() =>
      insertScriptAfterRoot({
        document: parseShell(),
        script: 'x = "</SCRIPT>"'
      })
    ).toThrow('would close its tag')
  })
})

const MANIFEST = {
  'index.html': {
    css: [],
    file: 'assets/index.js',
    imports: ['src/shell.ts']
  },
  'src/home.tsx': {
    css: [],
    file: 'assets/home.js',
    imports: ['src/layout.tsx', 'index.html']
  },
  'src/layout.tsx': { css: [], file: 'assets/layout.js', imports: [] },
  'src/shell.ts': { css: [], file: 'assets/shell.js', imports: [] }
}

const modulePreloadsOf = (document: Document): string[] =>
  headTags(document).filter((tag) => tag.includes('modulepreload'))

describe('module preloads', () => {
  it('links the chunks of the modules given, in import order, the entry left out', () => {
    const document = parseShell(INDENTED_SHELL_HTML)

    writeModulePreloads({
      document,
      manifest: MANIFEST,
      modules: ['src/home.tsx']
    })

    expect(modulePreloadsOf(document)).toEqual([
      'link crossorigin= href=/assets/layout.js rel=modulepreload',
      'link crossorigin= href=/assets/shell.js rel=modulepreload',
      'link crossorigin= href=/assets/home.js rel=modulepreload'
    ])
    expect(serializeDocument(document)).toContain(
      'src="/assets/index.js"></script>\n    <link'
    )
  })

  it('drops every modulepreload for an empty list', () => {
    const document = parseShell(INDENTED_SHELL_HTML)

    writeModulePreloads({ document, manifest: MANIFEST, modules: [] })

    expect(modulePreloadsOf(document)).toEqual([])
    expect(serializeDocument(document)).toContain(
      'src="/assets/index.js"></script>\n  </head>'
    )
  })
})

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
