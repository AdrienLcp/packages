import { placeAfter } from './formatted-insertion.ts'
import { onlyElement } from './html-document.ts'

const DEFAULT_ROOT = '#root'

const SCRIPT_CLOSING_TAG = /<\/script/i

/**
 * Sets `attributes` on the root: what the app reads before it takes the page
 * over, such as the path the document was written for or the data it was
 * written from. React renders inside the root and never touches its own
 * attributes, so they stay through hydration.
 */
export const setRootAttributes = ({
  attributes,
  document,
  rootSelector = DEFAULT_ROOT
}: {
  attributes: Readonly<Record<string, string>>
  document: Document
  rootSelector?: string
}): void => {
  const root = onlyElement({ document, selector: rootSelector })

  for (const [name, value] of Object.entries(attributes)) {
    root.setAttribute(name, value)
  }
}

/**
 * Sets a classic inline script right after the root. The parser runs it as
 * soon as the root is parsed, before the first paint and before any module
 * script, so it can read or empty the prerendered page — a guard that clears
 * a document the host served for another path, so the app renders the right
 * page from scratch instead of the wrong one flashing first.
 */
export const insertScriptAfterRoot = ({
  document,
  rootSelector = DEFAULT_ROOT,
  script
}: {
  document: Document
  rootSelector?: string
  /** The script's source, run as it is. */
  script: string
}): void => {
  if (SCRIPT_CLOSING_TAG.test(script)) {
    throw new Error(
      'prerender: the script after the root holds </script, which would close its tag'
    )
  }

  const element = document.createElement('script')

  element.textContent = script
  placeAfter({
    nodes: [element],
    reference: onlyElement({ document, selector: rootSelector })
  })
}
