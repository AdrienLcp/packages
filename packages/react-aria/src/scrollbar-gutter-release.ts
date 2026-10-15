import type React from 'react'
import { useEffect } from 'react'

const RELEASED_PROPERTIES = ['scrollbar-gutter', 'padding-inline-end'] as const

const releaseScrollbarGutter = (root: HTMLElement): (() => void) => {
  const gutter = window.innerWidth - root.clientWidth

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

  for (const property of RELEASED_PROPERTIES) {
    style.setProperty(property, released[property], 'important')
  }

  return () => {
    for (const { priority, property, value } of saved) {
      if (style.getPropertyValue(property) === released[property]) {
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
 * effect: the lock hides the overflow and reserves the gutter, and the gutter
 * it measured is the one released here. Released first, the page's scrollbar
 * still showed and the lock reserved its room again. On the way out, the lock
 * restores the root first, and a property it already put back is left alone.
 */
export const ScrollbarGutterRelease: React.FC = () => {
  useEffect(() => releaseScrollbarGutter(document.documentElement), [])

  return null
}
