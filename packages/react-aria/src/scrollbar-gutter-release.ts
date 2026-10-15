import type React from 'react'
import { useLayoutEffect } from 'react'

const releaseScrollbarGutter = (root: HTMLElement): (() => void) => {
  const gutter = window.innerWidth - root.clientWidth

  if (gutter <= 0) {
    return () => undefined
  }

  const { style } = root
  const saved = ['scrollbar-gutter', 'padding-inline-end'].map((property) => ({
    priority: style.getPropertyPriority(property),
    property,
    value: style.getPropertyValue(property)
  }))
  const padding =
    Number.parseFloat(getComputedStyle(root).paddingInlineEnd) || 0

  style.setProperty('scrollbar-gutter', 'auto', 'important')
  style.setProperty('padding-inline-end', `${padding + gutter}px`, 'important')

  return () => {
    for (const { priority, property, value } of saved) {
      style.setProperty(property, value, priority)
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
 * edge. It runs before react-aria's scroll lock, which then finds no gutter
 * to keep and only hides the overflow.
 */
export const ScrollbarGutterRelease: React.FC = () => {
  useLayoutEffect(() => releaseScrollbarGutter(document.documentElement), [])

  return null
}
