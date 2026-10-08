import { parseHTML } from 'linkedom'

/** `html` parsed into a DOM, to edit through elements rather than with patterns over its text. */
export const parseDocument = (html: string): Document =>
  parseHTML(html).document

/**
 * The document printed back, doctype and comments included. linkedom writes a
 * `<title>` and attribute values as they are, without escaping an `&`: a text
 * that would read back differently, such as a literal `&amp;`, throws instead
 * of shipping altered.
 */
export const serializeDocument = (document: Document): string => {
  const html = document.toString()

  if (parseDocument(html).toString() !== html) {
    throw new Error(
      'prerender: the edited document does not read back as written; a title or an attribute holds text that parses as a character reference'
    )
  }

  return html
}

/**
 * The one element `selector` matches. The shell stays a valid standalone
 * document with no placeholder syntax, so a tag edited out of it fails the
 * build instead of leaving every page with the wrong head.
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
      `prerender: ${selector} matched ${matches.length} elements, expected 1`
    )
  }

  return only
}

/** An element with these attributes, in that order; `true` writes a bare attribute. */
export const createElement = ({
  attributes,
  document,
  tagName
}: {
  attributes: Readonly<Record<string, string | true>>
  document: Document
  tagName: string
}): Element => {
  const element = document.createElement(tagName)

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value === true ? '' : value)
  }

  return element
}

/**
 * The module script Vite builds into the shell's head. What the head gains goes
 * ahead of it, so the browser finds it before it starts on the app.
 */
export const ENTRY_SCRIPT = 'head > script[type="module"][src]'

/** Puts `elements` in the head, ahead of the entry script. */
export const insertIntoHead = ({
  document,
  elements
}: {
  document: Document
  elements: readonly Element[]
}): void => {
  onlyElement({ document, selector: ENTRY_SCRIPT }).before(...elements)
}
