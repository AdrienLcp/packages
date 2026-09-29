# @adrienlcp/react-router

For apps whose links are
[react-aria-components](https://react-spectrum.adobe.com/react-aria/) and
whose routes are [react-router](https://reactrouter.com/): the wiring every
one of them repeats, kept in one version across them. React 19,
`react-aria-components` and `react-router` are peers.

```bash
pnpm add @adrienlcp/react-router
```

## Links that navigate on the client

```tsx
import { AriaRouterProvider } from '@adrienlcp/react-router'
import { Outlet } from 'react-router'

export const RootRoute: React.FC = () => (
  <AriaRouterProvider
    navigateDefaults={() => ({ viewTransition: !prefersReducedMotion() })}
  >
    <Outlet />
  </AriaRouterProvider>
)
```

Mounted in the root route's element, inside the router, it hands
react-aria's `RouterProvider` react-router's `navigate`: an `href` on any
react-aria `Link`, `MenuItem` or `ListBoxItem` below it becomes a client-side
navigation instead of a page load.

- **`routerOptions` are typed and forwarded.** Importing anything from this
  package augments react-aria's `RouterConfig`, so `routerOptions` on every
  react-aria link is react-router's `NavigateOptions`:
  `<Link href={paths.settings} routerOptions={{ replace: true }}>`. Drop the
  app's own `declare module 'react-aria-components'` block.
- **`navigateDefaults`** is read when each navigation happens, not when the
  provider renders, so a preference changed mid-session is followed. A link's
  own `routerOptions` override it.
- **A superseded navigation is not an error.** One navigation cut short by the
  next rejects with `AbortError`, more often with view transitions on; that
  rejection is swallowed, any other one is not.
- **Give links absolute paths.** A relative `href` is displayed resolved
  against the link's route, but `navigate` runs from the root route.

## An external URL left alone: `useRouterHref`

react-router's `useHref` resolves every href against the current route, an
external URL included: `https://example.com` would come out as
`/current/route/https:/example.com`. `useRouterHref` returns an absolute URL
untouched and defers to `useHref` for the rest. `AriaRouterProvider` already
uses it; it is exported for an app that wires `RouterProvider` itself.

## `ignoreSupersededNavigation`

The `.catch` handler behind the provider, for an app that calls `navigate`
itself: `Promise.resolve(navigate(to)).catch(ignoreSupersededNavigation)`
swallows the `AbortError` of a superseded navigation and throws anything else
again.
