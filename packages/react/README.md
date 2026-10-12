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

## Joining class names: `classNames`

```tsx
import { classNames } from '@adrienlcp/react'

<svg className={classNames('icon', className, isActive && 'active')} />
```

Joins with a space and drops the falsy values, so a conditional class is an
`&&` and an optional `className` prop needs no ternary. It takes strings only:
a react-aria `className` may be a function of the render state, which this
cannot resolve, so it is a type error here and goes through `composeClassName`
instead.

The react-aria helpers live in
[`@adrienlcp/react-aria`](https://github.com/AdrienLcp/packages/tree/main/packages/react-aria).
