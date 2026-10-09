import { appendFormatted } from './formatted-insertion.ts'
import { createElement, insertIntoHead, onlyElement } from './html-document.ts'

export const setTitle = ({
  document,
  title
}: {
  document: Document
  title: string
}): void => {
  onlyElement({ document, selector: 'head > title' }).textContent = title
}

/**
 * Sets the content of the one `<meta>` that `meta` names, an attribute
 * selector such as `name="description"` or `property="og:title"`.
 */
export const setMeta = ({
  document,
  meta,
  value
}: {
  document: Document
  meta: string
  value: string
}): void => {
  onlyElement({ document, selector: `head > meta[${meta}]` }).setAttribute(
    'content',
    value
  )
}

/** Every `setMeta` in one call, keyed by the attribute that names each tag. */
export const setMetaContents = ({
  document,
  metaContents
}: {
  document: Document
  metaContents: Readonly<Record<string, string>>
}): void => {
  for (const [meta, value] of Object.entries(metaContents)) {
    setMeta({ document, meta, value })
  }
}

const CANONICAL = 'head > link[rel="canonical"]'

const OPEN_GRAPH_URL = 'property="og:url"'

/** The canonical link is the one place a host is written down. */
export const originOfCanonical = (document: Document): string =>
  new URL(
    onlyElement({ document, selector: CANONICAL }).getAttribute('href') ?? ''
  ).origin

/**
 * Adds the canonical link, pointing at `url`, to a shell written without one:
 * a shell the host also answers every client-rendered path with must not
 * claim each of them is its own page. Sets the shell's `og:url` to the same
 * URL, or adds one beside the link when the shell has none. A shell that
 * already holds a canonical link throws: `writeLanguageVersions` rewrites it.
 */
export const addCanonical = ({
  document,
  url
}: {
  document: Document
  /** The page's absolute URL. */
  url: string
}): void => {
  if (document.querySelector(CANONICAL) !== null) {
    throw new Error(
      'prerender: the shell already holds a canonical link; writeLanguageVersions points it at the page'
    )
  }

  const hasOpenGraphUrl =
    document.querySelector(`head > meta[${OPEN_GRAPH_URL}]`) !== null

  if (hasOpenGraphUrl) {
    setMeta({ document, meta: OPEN_GRAPH_URL, value: url })
  }

  insertIntoHead({
    document,
    elements: [
      createElement({
        attributes: { href: url, rel: 'canonical' },
        document,
        tagName: 'link'
      }),
      ...(hasOpenGraphUrl
        ? []
        : [
            createElement({
              attributes: { content: url, property: 'og:url' },
              document,
              tagName: 'meta'
            })
          ])
    ]
  })
}

/**
 * The shell served, with a 404 status, on a path no page was built for. It
 * stays the bare shell: the not-found page names the path that was asked for,
 * which no build can know, so the app renders it.
 */
export const noindexShell = (shell: Document): void => {
  appendFormatted({
    nodes: [
      createElement({
        attributes: { content: 'noindex', name: 'robots' },
        document: shell,
        tagName: 'meta'
      })
    ],
    parent: shell.head
  })
}
