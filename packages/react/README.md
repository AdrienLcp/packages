# @adrienlcp/react

Two small React helpers, kept in one version across apps. No dependencies;
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

## Merging a react-aria `className`

```tsx
import { composeClassName } from '@adrienlcp/react'
import { Button as AriaButton, type ButtonProps } from 'react-aria-components'

export const Button = ({ className, isWide, ...props }: ButtonProps & { isWide?: boolean }) => (
  <AriaButton {...props} className={composeClassName(className, 'button', isWide && 'wide')} />
)
```

react-aria lets `className` be a function of the component's render state, so
the merge is a function too: it puts the component's own class names first,
resolves the caller's against the render state, and drops the falsy ones. It
fits a react-aria component, never a plain DOM element, where a template
literal does. It needs no react-aria dependency: `ClassNameOrFunction` is
written out here as the same type.
