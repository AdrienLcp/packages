import { Marked, Renderer, type Tokens } from 'marked'
import {
  type BundledLanguage,
  createCssVariablesTheme,
  createHighlighter,
  type ShikiTransformer
} from 'shiki'

import type { MarkdownRendering } from './catalogue.ts'
import { renderCodeSpan } from './code-span.ts'

/**
 * Colours come from custom properties the site's tokens define, so the code
 * follows the light and dark themes without a second render.
 */
const SITE_THEME = createCssVariablesTheme({
  fontStyle: true,
  name: 'site',
  variableDefaults: {},
  variablePrefix: '--code-'
})

const HIGHLIGHTED_LANGUAGES = [
  'bash',
  'css',
  'html',
  'json',
  'jsonc',
  'sass',
  'scss',
  'shellscript',
  'ts',
  'tsx'
] as const satisfies readonly BundledLanguage[]

const PLAIN_TEXT = 'text'

/** The page styles the block; shiki's own inline colours and tab stop would fight it. */
const leavePreToTheStylesheet: ShikiTransformer = {
  pre(node) {
    node.properties.style = undefined
    node.properties.tabindex = undefined
  }
}

/** A wide table scrolls in its own box rather than widening the page. */
function tableInScrollingBox(this: Renderer, table: Tokens.Table): string {
  return `<div class="table-scroll">${Renderer.prototype.table.call(this, table)}</div>`
}

const isRelativeLink = (href: string): boolean =>
  !/^[a-z][a-z\d+.-]*:/i.test(href) &&
  !href.startsWith('#') &&
  !href.startsWith('/')

/** One renderer for every Markdown file the site shows, highlighting its code. */
export const createMarkdownRendering = async (): Promise<MarkdownRendering> => {
  const highlighter = await createHighlighter({
    langs: [...HIGHLIGHTED_LANGUAGES],
    themes: [SITE_THEME]
  })
  const loaded = new Set(highlighter.getLoadedLanguages())

  const highlight = ({ lang, text }: Tokens.Code): string =>
    highlighter.codeToHtml(text, {
      lang: lang !== undefined && loaded.has(lang) ? lang : PLAIN_TEXT,
      theme: SITE_THEME.name ?? 'site',
      transformers: [leavePreToTheStylesheet]
    })

  const markedFor = (linkBase: string): Marked =>
    new Marked({
      gfm: true,
      renderer: {
        code: highlight,
        codespan: renderCodeSpan,
        table: tableInScrollingBox
      },
      walkTokens: (token) => {
        if (
          (token.type === 'link' || token.type === 'image') &&
          isRelativeLink(token.href)
        ) {
          token.href = new URL(token.href, linkBase).href
        }
      }
    })

  const inlineMarked = new Marked({
    gfm: true,
    renderer: { codespan: renderCodeSpan }
  })

  return {
    block: (markdown, linkBase) =>
      markedFor(linkBase).parse(markdown, { async: false }),
    inline: (markdown) => inlineMarked.parseInline(markdown, { async: false })
  }
}
