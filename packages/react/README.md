# @adrienlcp/react

Generic React helpers, kept in one version across apps. No dependencies;
React 19 is a peer.

```bash
pnpm add @adrienlcp/react
```

## A context that names its missing provider

```tsx
import { createSafeContext } from '@adrienlcp/react'

export const [PlayerContext, usePlayer, useOptionalPlayer] =
  createSafeContext<Player>('PlayerContext')

<PlayerContext value={player}>…</PlayerContext>
```

`usePlayer()` returns the value, or throws
`PlayerContext was read outside of its provider` when no provider is mounted
above: a whole class of `undefined` bugs becomes one loud error naming what to
mount. `useOptionalPlayer()` answers `undefined` there instead, for a component
that also works on its own. The name doubles as the context's `displayName` in
the React DevTools.

The react-aria helpers live in
[`@adrienlcp/react-aria`](https://github.com/AdrienLcp/packages/tree/main/packages/react-aria).

## Leaving without being cut short: `Animate`

```tsx
import { Animate, staggerStyle } from '@adrienlcp/react'

<Animate as="aside" className="toast" isVisible={isOpen} onExited={forget}>
  {message}
</Animate>
```

```sass
.toast
  opacity: 1
  transition: opacity var(--transition-base)

  @starting-style
    opacity: 0

  &[data-exiting]
    opacity: 0
```

React unmounts at once, so an exit transition never plays. `Animate` keeps
the element rendered with `data-exiting` once `isVisible` turns false, until
every transition and animation in it has ended, then unmounts it and calls
`onExited`. The motion is entirely the stylesheet's, through the hooks a
react-aria overlay offers (`@starting-style` for the entry, `[data-exiting]`
for the exit): no duration to repeat in JavaScript, and a reduced-motion
`0ms` leaves at once. `keepMounted` hides the element (`hidden`) instead of
removing it, for state a remount would lose.

A list enters one item after the other with `staggerStyle(index, count)`,
which hands each item `--stagger-index` and `--stagger-count`. Take the step
from a duration token, so reduced motion zeroes the delays along with the
durations:

```sass
.item
  transition-delay: calc(var(--stagger-index) * var(--transition-fast))

  &[data-exiting]
    transition-delay: calc((var(--stagger-count) - 1 - var(--stagger-index)) * var(--transition-fast))
```

A page change, or a state change that is a transition, animates with React's
`<ViewTransition>` instead: `Animate` is for the element that comes and goes
while the rest of the page stays interactive.
