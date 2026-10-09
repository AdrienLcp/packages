import { describe, expect, it } from 'vitest'

import { noindexShell } from './head-tags.ts'
import {
  createElement,
  insertIntoHead,
  onlyElement,
  serializeDocument
} from './html-document.ts'
import { writeLanguageVersions } from './language-versions.ts'
import { insertScriptAfterRoot } from './page-root.ts'
import { renderIntoShell } from './rendered-page.ts'
import { INDENTED_SHELL_HTML, parseShell } from './shell.fixture.ts'
import { appendStructuredData } from './structured-data.ts'

const headOf = (document: Document): string =>
  serializeDocument(document).split('<head>')[1]?.split('</head>')[0] ?? ''

describe('formatted insertion', () => {
  it('puts every tag it adds to the head on a line of its own, indented as the shell is', () => {
    const document = parseShell(INDENTED_SHELL_HTML)

    insertIntoHead({
      document,
      elements: [
        createElement({
          attributes: { content: 'A', name: 'author' },
          document,
          tagName: 'meta'
        })
      ]
    })
    writeLanguageVersions({
      current: 'https://example.com/en',
      document,
      versions: [
        {
          href: 'https://example.com/en',
          hreflang: 'en',
          openGraphLocale: 'en_GB'
        },
        {
          href: 'https://example.com/fr',
          hreflang: 'fr',
          openGraphLocale: 'fr_FR'
        }
      ]
    })
    appendStructuredData({ data: { name: 'A' }, document })
    noindexShell(document)

    expect(headOf(document)).toBe(`
    <meta charset="utf-8">
    <title>Shell</title>
    <meta property="og:locale" content="en_GB">
    <meta property="og:locale:alternate" content="fr_FR">
    <link rel="canonical" href="https://example.com/en">
    <link rel="alternate" hreflang="en" href="https://example.com/en">
    <link rel="alternate" hreflang="fr" href="https://example.com/fr">
    <link rel="stylesheet" href="/assets/index.css">
    <meta name="author" content="A">
    <script type="module" crossorigin="" src="/assets/index.js"></script>
    <link rel="modulepreload" crossorigin="" href="/assets/vendor.js">
    <script type="application/ld+json">{"name":"A"}</script>
    <meta name="robots" content="noindex">
  `)
  })

  it('adds no whitespace inside the root, whose text hydration compares', () => {
    const document = parseShell(INDENTED_SHELL_HTML)

    renderIntoShell({
      document,
      html: '<title>Home</title><meta name="author" content="A"><main><p>Hi</p></main>',
      path: '/'
    })
    insertScriptAfterRoot({ document, script: 'void 0' })

    expect(onlyElement({ document, selector: '#root' }).innerHTML).toBe(
      '<main><p>Hi</p></main>'
    )
    expect(serializeDocument(document)).toContain(`<body>
    <div id="root"><main><p>Hi</p></main></div>
    <script>void 0</script>
  </body>`)
  })

  it('[prerender] appends to an empty head with no indentation to copy', () => {
    const document = parseShell(
      '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>'
    )

    noindexShell(document)

    expect(headOf(document)).toBe('<meta name="robots" content="noindex">')
  })
})
