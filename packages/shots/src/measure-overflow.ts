/** An element that reaches past the viewport's left or right edge. */
export type OverflowCandidate = {
  /** `div#plate.card.wide`: what a reader searches the markup for. */
  label: string
  left: number
  /** `main:nth-child(2)>div:nth-child(1)` from `body`: tells an ancestor from its descendants. */
  path: string
  right: number
}

/** What the page measured of its own width, and who sticks out. */
export type OverflowMeasure = {
  candidates: OverflowCandidate[]
  documentWidth: number
  viewportWidth: number
}

/**
 * Runs in the page once it settled: the document's width against the
 * viewport's, and every element out of the viewport that no scroll container
 * clips — the ones that make a phone scroll sideways. Self-contained, since
 * Playwright sends its source text alone.
 */
export const measureOverflow = (): OverflowMeasure => {
  const root = document.documentElement
  const viewportWidth = root.clientWidth
  const maxClassesInLabel = 2
  const clippingOverflows = new Set(['auto', 'clip', 'hidden', 'scroll'])

  const clipsHorizontally = (element: Element): boolean =>
    clippingOverflows.has(getComputedStyle(element).overflowX)

  const isClipped = (element: Element): boolean => {
    for (
      let ancestor = element.parentElement;
      ancestor !== null && ancestor !== document.body && ancestor !== root;
      ancestor = ancestor.parentElement
    ) {
      if (clipsHorizontally(ancestor)) return true
    }
    return false
  }

  const segmentOf = (element: Element): string => {
    const siblings = element.parentElement?.children ?? []
    const position = Array.prototype.indexOf.call(siblings, element) + 1
    return `${element.tagName.toLowerCase()}:nth-child(${position})`
  }

  const pathOf = (element: Element): string => {
    const segments: string[] = []
    for (
      let current: Element | null = element;
      current !== null && current !== document.body;
      current = current.parentElement
    ) {
      segments.unshift(segmentOf(current))
    }
    return segments.join('>')
  }

  const labelOf = (element: Element): string => {
    const id = element.id === '' ? '' : `#${element.id}`
    const classes = [...element.classList]
      .slice(0, maxClassesInLabel)
      .map((name) => `.${name}`)
      .join('')
    return `${element.tagName.toLowerCase()}${id}${classes}`
  }

  const candidates = [...document.body.querySelectorAll('*')].flatMap(
    (element) => {
      const box = element.getBoundingClientRect()
      const outside = box.right > viewportWidth || box.left < 0
      if (box.width === 0 || !outside || isClipped(element)) return []
      return [
        {
          label: labelOf(element),
          left: box.left,
          path: pathOf(element),
          right: box.right
        }
      ]
    }
  )

  return { candidates, documentWidth: root.scrollWidth, viewportWidth }
}
