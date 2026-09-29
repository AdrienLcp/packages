import type React from 'react'
import { createElement, type ReactNode } from 'react'
import { RouterProvider } from 'react-aria-components'
import { type NavigateOptions, useNavigate } from 'react-router'

import { ignoreSupersededNavigation } from './ignore-superseded-navigation.ts'
import { useRouterHref } from './use-router-href.ts'

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

export type AriaRouterProviderProps = {
  children?: ReactNode
  /**
   * Options every navigation starts from, read when it happens rather than
   * when the provider renders, so `() => ({ viewTransition:
   * !prefersReducedMotion() })` follows a preference changed mid-session. A
   * link's own `routerOptions` override them.
   */
  navigateDefaults?: () => NavigateOptions
}

/**
 * react-aria's `RouterProvider` wired to react-router: an `href` on any
 * react-aria `Link`, `MenuItem` or `ListBoxItem` below it becomes a
 * client-side navigation instead of a page load, its `routerOptions` are
 * forwarded to `navigate`, and an external URL is left as it is. Mount it
 * inside the router, in the root route's element.
 *
 * Give links absolute paths: a relative `href` is displayed resolved against
 * the link's route, but navigates from the route rendering this provider.
 */
export const AriaRouterProvider: React.FC<AriaRouterProviderProps> = ({
  children,
  navigateDefaults
}) => {
  const navigate = useNavigate()

  return createElement(RouterProvider, {
    children,
    navigate: (path, options) => {
      void Promise.resolve(
        navigate(path, { ...navigateDefaults?.(), ...options })
      ).catch(ignoreSupersededNavigation)
    },
    useHref: useRouterHref
  })
}
