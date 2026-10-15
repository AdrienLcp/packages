import { useMediaQuery } from '@adrienlcp/browser/react'
import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { createElement, Fragment, type ReactNode } from 'react'
import {
  Modal,
  ModalOverlay,
  Popover,
  type PopoverProps
} from 'react-aria-components'

import { SheetGrabber } from './sheet-grabber.ts'

export type PopoverSheetProps = {
  /** The `Dialog` the trigger opens, the same on both faces. */
  children: ReactNode
  /** The surface's own class, on the popover and the sheet alike. */
  className?: string
  /** The popover's tallest, in pixels. The sheet stops short of the screen's top instead. */
  maxHeight?: PopoverProps['maxHeight']
  /** Where the popover opens from its trigger. */
  placement?: PopoverProps['placement']
  /**
   * The media query a screen wide enough for the popover answers, the app's
   * own breakpoint: `'(width >= 56.25rem)'`. Below it, the sheet.
   */
  wideQuery: string
}

/**
 * What a trigger opens, in the place of a `Popover` inside a `DialogTrigger`:
 * a popover beside the trigger on a screen that answers `wideQuery`, a sheet
 * rising from the bottom edge below it, where a box hung from a corner is out
 * of a thumb's reach. The sheet is pulled down by its `SheetGrabber`, or put
 * away by a press on the scrim or Escape.
 *
 * The popover carries `sheet-popover`; the sheet is `sheet` inside a
 * `sheet-overlay`, styled by the `sheet` Sass module.
 *
 * The sheet is a plain `Modal` with its own rise in CSS rather than
 * react-aria's `Sheet`: that one enters through the browser's smooth scroll,
 * whose length no stylesheet sets, and at over half a second it read as lag
 * after the press.
 */
export const PopoverSheet: React.FC<PopoverSheetProps> = ({
  children,
  className,
  maxHeight,
  placement,
  wideQuery
}) => {
  const isWide = useMediaQuery(wideQuery)

  if (isWide) {
    return createElement(Popover, {
      children,
      className: classNames('sheet-popover', className),
      maxHeight,
      placement
    })
  }

  return createElement(ModalOverlay, {
    children: createElement(Modal, {
      children: ({ state }) =>
        createElement(
          Fragment,
          null,
          createElement(SheetGrabber, { onDismiss: state.close }),
          children
        ),
      className: classNames('sheet', className)
    }),
    className: 'sheet-overlay',
    isDismissable: true
  })
}
