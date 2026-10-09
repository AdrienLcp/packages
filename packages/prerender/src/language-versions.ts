import { placeAfter } from './formatted-insertion.ts'
import { setMeta } from './head-tags.ts'
import { createElement, onlyElement } from './html-document.ts'

/** One language a page exists in. */
export type LanguageVersion = {
  /** Absolute URL of the page in that language. */
  href: string
  /** `en`, `fr-CA`: what `hreflang` and the sitemap name the language by. */
  hreflang: string
  /** `en_GB`, `fr_FR`: Open Graph names a locale with an underscore. */
  openGraphLocale: string
}

const OPEN_GRAPH_LOCALE = 'head > meta[property="og:locale"]'

/**
 * Points the canonical link at `current`, and lists every language the page
 * exists in: an `hreflang` alternate each, `current` included since search
 * engines only trust links that are reciprocal, plus `x-default` when given.
 * When the shell carries `og:locale`, it names `current`'s locale and an
 * `og:locale:alternate` follows it for each other one.
 */
export const writeLanguageVersions = ({
  current,
  document,
  versions,
  xDefault
}: {
  /** The `href` of the page being written, one of `versions`. */
  current: string
  document: Document
  versions: readonly LanguageVersion[]
  /** The page that picks a language for the visitor, such as the site root. */
  xDefault?: string
}): void => {
  const page = versions.find((version) => version.href === current)

  if (page === undefined) {
    throw new Error(
      `prerender: ${current} is not among its own language versions`
    )
  }

  const canonical = onlyElement({
    document,
    selector: 'head > link[rel="canonical"]'
  })

  canonical.setAttribute('href', current)
  placeAfter({
    nodes: [
      ...versions.map(({ href, hreflang }) => ({ href, hreflang })),
      ...(xDefault === undefined
        ? []
        : [{ href: xDefault, hreflang: 'x-default' }])
    ].map((alternate) =>
      createElement({
        attributes: { ...alternate, rel: 'alternate' },
        document,
        tagName: 'link'
      })
    ),
    reference: canonical
  })

  if (document.querySelector(OPEN_GRAPH_LOCALE) === null) {
    return
  }

  setMeta({
    document,
    meta: 'property="og:locale"',
    value: page.openGraphLocale
  })
  placeAfter({
    nodes: versions
      .filter((version) => version !== page)
      .map((version) =>
        createElement({
          attributes: {
            content: version.openGraphLocale,
            property: 'og:locale:alternate'
          },
          document,
          tagName: 'meta'
        })
      ),
    reference: onlyElement({ document, selector: OPEN_GRAPH_LOCALE })
  })
}
