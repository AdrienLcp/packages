import { JSDOM } from 'jsdom'

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'

/** A document parsed the way a browser parses it, to edit and write back out. */
export type HtmlDocument = {
  document: Document
  serialize: () => string
}

export const parseHtmlDocument = (html: string): HtmlDocument => {
  const dom = new JSDOM(html)

  return { document: dom.window.document, serialize: () => dom.serialize() }
}

/**
 * The one element `selector` matches. `index.html` stays a valid standalone
 * document with no placeholder syntax, so a tag edited out of it fails the
 * build instead of leaving every document with the wrong head.
 */
export const onlyElement = ({
  document,
  selector
}: {
  document: Document
  selector: string
}): Element => {
  const matches = document.querySelectorAll(selector)
  const [only] = matches

  if (matches.length !== 1 || only === undefined) {
    throw new Error(
      `${selector} matched ${matches.length} elements in index.html, expected 1`
    )
  }

  return only
}

/** The document's `<title>` elements, leaving out a drawing's own. */
export const documentTitlesIn = (root: Element): readonly Element[] => [
  ...root.getElementsByTagNameNS(HTML_NAMESPACE, 'title')
]

/** A `<link>` with these attributes, in that order; `true` writes a bare attribute. */
export const createLink = ({
  attributes,
  document
}: {
  attributes: Record<string, string | true>
  document: Document
}): HTMLLinkElement => {
  const link = document.createElement('link')

  for (const [name, value] of Object.entries(attributes)) {
    link.setAttribute(name, value === true ? '' : value)
  }

  return link
}
