import { setTitle } from './head-tags.ts'
import { insertIntoHead, onlyElement } from './html-document.ts'

/** What React writes ahead of the page it renders. */
const HEAD_TAG_NAMES = new Set(['LINK', 'META', 'TITLE'])

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'

/** A drawing's `<title>` sits in its `<svg>` and is not the page's. */
const isPageTitle = (element: Element): boolean =>
  element.tagName.toUpperCase() === 'TITLE' &&
  element.namespaceURI === HTML_NAMESPACE

const leadingHeadTagsOf = (root: Element): Element[] => {
  const leading: Element[] = []

  for (
    let next = root.firstElementChild;
    next !== null && HEAD_TAG_NAMES.has(next.tagName.toUpperCase());
    next = next.nextElementSibling
  ) {
    leading.push(next)
  }

  return leading
}

/**
 * Writes the server-rendered `html` into the shell's `root`, and moves what
 * React rendered ahead of the page — its `<title>`, its `<meta>` tags, the
 * resources it asks for — into the head. The browser finds them sooner there,
 * and the app, which puts them in the head too, then hydrates the same tree
 * under the root as the prerender. Returns the page's title, which the shell's
 * `<title>` now holds.
 */
export const renderIntoShell = ({
  document,
  html,
  path,
  rootSelector = '#root'
}: {
  document: Document
  html: string
  /** The page's path, to name it when its render breaks the rules. */
  path: string
  rootSelector?: string
}): { title: string } => {
  const root = onlyElement({ document, selector: rootSelector })

  root.innerHTML = html

  const leading = leadingHeadTagsOf(root)
  const pageTitles = [...root.querySelectorAll('title')].filter(isPageTitle)
  const [title] = pageTitles

  if (
    pageTitles.length !== 1 ||
    title === undefined ||
    !leading.includes(title)
  ) {
    throw new Error(
      `prerender: ${path} rendered ${pageTitles.length} page <title> elements, expected 1 ahead of the page`
    )
  }

  for (const element of leading) {
    element.remove()
  }

  insertIntoHead({
    document,
    elements: leading.filter((element) => element !== title)
  })

  const text = title.textContent ?? ''

  setTitle({ document, title: text })

  return { title: text }
}
