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
