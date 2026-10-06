import { parseHTML } from 'linkedom'

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'

/** `Node.ELEMENT_NODE`: Node has no DOM globals to read it from. */
const ELEMENT_NODE = 1

export const isElement = (node: Node): node is Element =>
  node.nodeType === ELEMENT_NODE

/** A document parsed into the browser DOM, to edit and write back out. */
export type HtmlDocument = {
  document: Document
  serialize: () => string
}

/**
 * linkedom keeps the markup's own tree: a fragment stays a fragment, with no
 * `<html>`, `<head>` or `<body>` made up around it.
 */
const parseDocument = (html: string): Document => parseHTML(html).document

/**
 * linkedom writes a `<title>` and attribute values as they are, without
 * escaping an `&`: a text that would read back differently, such as a literal
 * `&amp;`, fails the build instead of shipping altered.
 */
const serializeDocument = (document: Document): string => {
  const html = document.toString()

  if (parseDocument(html).toString() !== html) {
    throw new Error(
      'the edited document does not read back as written: a title or an attribute holds text that parses as a character reference'
    )
  }

  return html
}

export const parseHtmlDocument = (html: string): HtmlDocument => {
  const document = parseDocument(html)

  return { document, serialize: () => serializeDocument(document) }
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

/** The document `<title>` elements among `nodes` and their descendants, leaving out a drawing's own. */
export const documentTitlesIn = (nodes: readonly Node[]): Element[] =>
  nodes
    .filter(isElement)
    .flatMap((element) => [
      ...(element.matches('title') ? [element] : []),
      ...element.querySelectorAll('title')
    ])
    .filter((title) => title.namespaceURI === HTML_NAMESPACE)

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
