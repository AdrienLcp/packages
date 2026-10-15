import type React from 'react'
import { useEffect } from 'react'

const RELEASED_PROPERTIES = ['scrollbar-gutter', 'padding-inline-end'] as const

/**
 * The window's width less the viewport a fixed element fills. The root's
 * `clientWidth` cannot tell it: Chromium counts a stable gutter there only
 * while a scrollbar shows in it, not on a page too short to scroll, nor once
 * the overflow is hidden.
 */
const measureScrollbarGutter = (root: HTMLElement): number => {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position: fixed; inset: 0; visibility: hidden; pointer-events: none'
  root.append(probe)
  const viewportWidth = probe.getBoundingClientRect().width
  probe.remove()

  return viewportWidth > 0 ? window.innerWidth - viewportWidth : 0
}

const releaseScrollbarGutter = (root: HTMLElement): (() => void) => {
  const gutter = measureScrollbarGutter(root)

  if (gutter <= 0) {
    return () => undefined
  }

  const { style } = root
  const padding =
    Number.parseFloat(getComputedStyle(root).paddingInlineEnd) || 0
  const released = {
    'padding-inline-end': `${padding + gutter}px`,
    'scrollbar-gutter': 'auto'
  }
  const saved = RELEASED_PROPERTIES.map((property) => ({
    priority: style.getPropertyPriority(property),
    property,
    value: style.getPropertyValue(property)
  }))

  const applied = RELEASED_PROPERTIES.map((property) => {
    style.setProperty(property, released[property], 'important')

    return style.getPropertyValue(property)
  })

  // Read back rather than compared with what was written: the browser
  // rounds a fractional gutter, `15.333333px` reading `15.3333px`.
  return () => {
    for (const [index, { priority, property, value }] of saved.entries()) {
      if (style.getPropertyValue(property) === applied[index]) {
        style.setProperty(property, value, priority)
      }
    }
  }
}

/**
 * Rendered inside the sheet's overlay, for as long as it is on screen, its
 * exit included. A reserved scrollbar gutter is no part of the viewport a
 * fixed scrim covers, and Chromium paints nothing there but the root's
 * background colour, so a page with `scrollbar-gutter: stable` kept a bright
 * strip down the scrim's edge. While the overlay is up, the gutter becomes
 * padding on the root: the page keeps its width and the scrim reaches the
 * edge.
 *
 * A passive effect, so it runs after react-aria's scroll lock, a layout
 * effect of the overlay above: released before it, the page's scrollbar still
 * showed and the lock reserved its room again. On the way out, the lock
 * restores the root first, and a property it already put back is left alone.
 */
export const ScrollbarGutterRelease: React.FC = () => {
  useEffect(() => releaseScrollbarGutter(document.documentElement), [])

  return null
}
