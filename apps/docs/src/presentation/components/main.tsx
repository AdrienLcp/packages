import type React from 'react'

import './main.sass'

const MAIN_ID = 'main'

export const MAIN_HREF = `#${MAIN_ID}`

const keepBackgroundClicksInert = (
  event: React.MouseEvent<HTMLElement>
): void => {
  if (event.target === event.currentTarget) {
    event.preventDefault()
  }
}

/**
 * Every page's `<main>`: the skip link's target, and where focus lands after a
 * navigation.
 */
export const Main: React.FC<
  Omit<React.ComponentProps<'main'>, 'id' | 'onMouseDown' | 'tabIndex'>
> = (props) => (
  <main
    {...props}
    id={MAIN_ID}
    onMouseDown={keepBackgroundClicksInert}
    tabIndex={-1}
  />
)

export const focusMain = (options?: FocusOptions): void => {
  document.getElementById(MAIN_ID)?.focus(options)
}
