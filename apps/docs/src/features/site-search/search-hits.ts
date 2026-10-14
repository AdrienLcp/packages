import type {
  PagefindDocument,
  PagefindSubResult
} from '@/infrastructure/search/pagefind-index'

/** A run of an excerpt's text, marked when it is what the query matched. */
export type ExcerptPart = {
  isMatch: boolean
  /** Where the run starts in the excerpt's text, which tells it from any other run. */
  start: number
  text: string
}

/** A part of a page the query matched, with the words around the match. */
export type SearchSection = {
  excerpt: readonly ExcerptPart[]
  /** The page's path, then the section's anchor when it has one. */
  href: string
  /** `null` for the text above the page's first section heading. */
  title: string | null
}

/** One page the query matched, and its sections that hold the match. */
export type SearchHit = {
  href: string
  /** The package the page documents, or `null` for a page about none. */
  packageName: string | null
  sections: readonly SearchSection[]
  title: string
}

/** How many sections a page shows, its best first: the rest are a click away on the page. */
const SECTIONS_PER_PAGE = 3

const PAGE_TITLE_HEADING = 'h1'

const MARK_TAG = /<\/?mark>/

/**
 * Pagefind names the file it read, `/fr/i18n.html`; the site serves the page
 * at `/fr/i18n`, the address every other link uses.
 */
export const servedPathOf = (url: string): string =>
  url.replace(/\.html(?=#|$)/, '')

const unescaped = (text: string): string =>
  text.replaceAll('&lt;', '<').replaceAll('&gt;', '>')

/** Pagefind's excerpt is escaped text with `<mark>` around each match: split, and unescaped. */
export const excerptPartsOf = (excerpt: string): ExcerptPart[] => {
  const parts: ExcerptPart[] = []
  let start = 0

  for (const [index, run] of excerpt.split(MARK_TAG).entries()) {
    const text = unescaped(run)

    if (text !== '') {
      parts.push({ isMatch: index % 2 === 1, start, text })
      start += text.length
    }
  }

  return parts
}

const matchCountOf = (subResult: PagefindSubResult): number =>
  subResult.excerpt.split('<mark>').length - 1

const sectionOf = ({
  pageHref,
  subResult
}: {
  pageHref: string
  subResult: PagefindSubResult
}): SearchSection => {
  const isAboveFirstSection =
    subResult.anchor === undefined ||
    subResult.anchor.element === PAGE_TITLE_HEADING

  return {
    excerpt: excerptPartsOf(subResult.excerpt),
    href: isAboveFirstSection ? pageHref : servedPathOf(subResult.url),
    title: isAboveFirstSection ? null : subResult.title
  }
}

/** Two matches above the first heading lead to the same place: the page lists it once. */
const isFirstWithItsHref = (
  section: SearchSection,
  index: number,
  sections: readonly SearchSection[]
): boolean => sections.findIndex(({ href }) => href === section.href) === index

const packageNameIn = ({
  href,
  packageNames
}: {
  href: string
  packageNames: ReadonlySet<string>
}): string | null => {
  const [, , segment] = href.split('/')

  return segment !== undefined && packageNames.has(segment) ? segment : null
}

/** A page Pagefind found, as the search dialog lists it. */
export const searchHitOf = ({
  document,
  packageNames
}: {
  document: PagefindDocument
  packageNames: ReadonlySet<string>
}): SearchHit => {
  const href = servedPathOf(document.url)
  const subResults = document.sub_results.toSorted(
    (first, second) => matchCountOf(second) - matchCountOf(first)
  )
  const sections =
    subResults.length === 0
      ? [{ excerpt: excerptPartsOf(document.excerpt), href, title: null }]
      : subResults
          .map((subResult) => sectionOf({ pageHref: href, subResult }))
          .filter(isFirstWithItsHref)
          .slice(0, SECTIONS_PER_PAGE)

  return {
    href,
    packageName: packageNameIn({ href, packageNames }),
    sections,
    title: document.meta.title ?? href
  }
}
