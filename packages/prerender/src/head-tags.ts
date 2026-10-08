import { createElement, onlyElement } from './html-document.ts'

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

/** The canonical link is the one place a host is written down. */
export const originOfCanonical = (document: Document): string =>
  new URL(
    onlyElement({
      document,
      selector: 'head > link[rel="canonical"]'
    }).getAttribute('href') ?? ''
  ).origin

/**
 * The shell served, with a 404 status, on a path no page was built for. It
 * stays the bare shell: the not-found page names the path that was asked for,
 * which no build can know, so the app renders it.
 */
export const noindexShell = (shell: Document): void => {
  shell.head.append(
    createElement({
      attributes: { content: 'noindex', name: 'robots' },
      document: shell,
      tagName: 'meta'
    })
  )
}
