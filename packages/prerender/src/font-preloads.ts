import { placeBefore } from './formatted-insertion.ts'
import { createElement, ENTRY_SCRIPT, onlyElement } from './html-document.ts'

const FONT_FACE_RULES = /@font-face\s*\{[^}]*\}/g

const URLS = /url\(\s*(["']?)([^"')]+)\1\s*\)/g

const FONT_TYPES: Readonly<Record<string, string>> = {
  ttf: 'font/ttf',
  woff: 'font/woff',
  woff2: 'font/woff2'
}

/**
 * A latin subset's `.woff2`, named `<face>-latin.woff2` as Google Fonts cuts
 * it, served from `public/` or carrying the eight-character hash Vite gives an
 * imported asset. `-latin-ext` stays out: an English or French page rarely
 * reaches it.
 */
const LATIN_WOFF2 = /-latin(?:-[\w-]{8})?\.woff2$/

const fontFaceUrlsIn = (css: string): string[] => [
  ...new Set(
    [...css.matchAll(FONT_FACE_RULES)].flatMap(([rule]) =>
      [...rule.matchAll(URLS)].flatMap(([, , url]) => url ?? [])
    )
  )
]

const fontTypeOf = (url: string): string => {
  const type = FONT_TYPES[url.split('.').at(-1) ?? '']

  if (type === undefined) {
    throw new Error(`prerender: ${url} is not a font file a preload can type`)
  }

  return type
}

/** Which faces to preload: a pattern of their URLs, several in the order to ask for them, or `'none'`. */
export type FontPreloadSelection = RegExp | readonly RegExp[] | 'none'

const ANOTHER_PRELOAD = 'head > link[rel="preload"]'

/** The URLs each pattern picks, pattern after pattern, each once. */
const selectedUrls = ({
  include,
  urls
}: {
  include: FontPreloadSelection
  urls: readonly string[]
}): string[] => {
  if (include === 'none') {
    return []
  }

  const patterns = include instanceof RegExp ? [include] : include

  return [
    ...new Set(
      patterns.flatMap((pattern) => urls.filter((url) => pattern.test(url)))
    )
  ]
}

/**
 * Preloads the faces the page's inlined CSS declares whose URL `include`
 * matches. At the default priority: Chrome holds the first paint a moment for
 * a preloaded `font-display: optional` face, which is what lets a first visit
 * get it; at low priority the face queues behind the app's modules and misses
 * that paint. The preloads go ahead of any other the head holds — an image
 * the page asked for — and ahead of the entry script, in `include`'s order
 * when it lists several patterns: the face most of the page is set in first.
 * Only a prerendered page should carry them: the bare shell paints nothing
 * before the app runs, so a preload there sits unused while the browser warns
 * about it. `'none'` adds nothing, for a page set in system faces alone.
 */
export const addFontPreloads = ({
  css,
  document,
  include = LATIN_WOFF2
}: {
  /** The CSS the page inlines, as `inlinePageStylesheets` returns it. */
  css: string
  document: Document
  /** The face URLs to preload; the latin `.woff2` files by default. */
  include?: FontPreloadSelection
}): void => {
  placeBefore({
    nodes: selectedUrls({ include, urls: fontFaceUrlsIn(css) }).map((url) =>
      createElement({
        attributes: {
          as: 'font',
          crossorigin: true,
          href: url,
          rel: 'preload',
          type: fontTypeOf(url)
        },
        document,
        tagName: 'link'
      })
    ),
    reference:
      document.querySelector(ANOTHER_PRELOAD) ??
      onlyElement({ document, selector: ENTRY_SCRIPT })
  })
}
