const TEXT_NODE = 3

/** Where the prerendered page and the app's first render first differ. */
export type PrerenderedTextMismatch = {
  /** The position of the first text node that differs, in document order. */
  index: number
  /** That text node in the prerendered page; `null` when the page ran out first. */
  prerendered: string | null
  /** That text node after the app's first render; `null` when it ran out first. */
  rendered: string | null
}

/**
 * The text nodes under `root`, in document order, empty ones left out: a
 * server render separates adjacent texts with a comment, a client render
 * keeps them apart as nodes of their own, and both read the same here.
 */
export const textNodesOf = (root: Node): string[] =>
  [...root.childNodes].flatMap((child) => {
    if (child.nodeType === TEXT_NODE) {
      const text = child.textContent ?? ''

      return text === '' ? [] : [text]
    }

    return textNodesOf(child)
  })

const firstMismatch = ({
  prerendered,
  rendered
}: {
  prerendered: readonly string[]
  rendered: readonly string[]
}): PrerenderedTextMismatch | null => {
  const length = Math.max(prerendered.length, rendered.length)

  for (let index = 0; index < length; index += 1) {
    const before = prerendered[index] ?? null
    const after = rendered[index] ?? null

    if (before !== after) {
      return { index, prerendered: before, rendered: after }
    }
  }

  return null
}

/**
 * Reads the prerendered page's text in `root` now, before the app renders
 * over it; `findMismatch`, called after the app's first render, says where
 * that render's text first differs from it, or `null` when every text node is
 * the same. A difference is a page the visitor saw change as the app took
 * over — a date formatted in another zone, a value only the browser knows —
 * and under `hydrateRoot` the subtree React threw away to render again. A
 * development build or an end-to-end test reports it.
 */
export const capturePrerenderedText = (
  root: Node
): { findMismatch: () => PrerenderedTextMismatch | null } => {
  const prerendered = textNodesOf(root)

  return {
    findMismatch: () =>
      firstMismatch({ prerendered, rendered: textNodesOf(root) })
  }
}
