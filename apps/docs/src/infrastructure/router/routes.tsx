import type { LoaderFunction, RouteObject } from 'react-router'

import { NotFoundPage } from '@/features/not-found/not-found-page'
import { LocalePrefixedRoutes } from '@/infrastructure/router/locale-prefixed-routes'
import { localizedPaths } from '@/infrastructure/router/navigation'
import { NegotiatedLocaleRedirect } from '@/infrastructure/router/negotiated-locale-redirect'
import { RootRoute } from '@/infrastructure/router/root-route'
import { ErrorScreen } from '@/presentation/error-screen'
import { RouteFallback } from '@/presentation/route-fallback'

type LocalizedPath = (typeof localizedPaths)[keyof typeof localizedPaths]

/** Keyed by path, so a path with no page fails to compile. */
const pageFor = {
  [localizedPaths.home]: async () => ({
    Component: (await import('@/features/home/home-page')).HomePage
  }),
  [localizedPaths.package]: async () => ({
    Component: (await import('@/features/package-pages/package-page'))
      .PackagePage
  })
} satisfies Record<LocalizedPath, RouteObject['lazy']>

/**
 * Outside `lazy`, so the data starts loading beside the page's chunk. Imported
 * on demand rather than at the top, so each page downloads its own loader and
 * not every other page's.
 */
const loaderFor = {
  [localizedPaths.home]: async () =>
    (await import('@/features/home/home-loader')).homeLoader(),
  [localizedPaths.package]: async ({ params }) =>
    (await import('@/features/package-pages/package-loader')).packageLoader({
      packageName: params.packageName ?? ''
    })
} satisfies Record<LocalizedPath, LoaderFunction>

const routeFor = (path: LocalizedPath): RouteObject => ({
  lazy: pageFor[path],
  loader: loaderFor[path],
  path
})

/** The tree, not a router: a prerender can mount the same one. */
export const routes: RouteObject[] = [
  {
    Component: RootRoute,
    children: [
      { Component: NegotiatedLocaleRedirect, index: true },
      {
        Component: LocalePrefixedRoutes,
        children: Object.values(localizedPaths).map(routeFor)
      },
      { Component: NotFoundPage, path: '*' }
    ],
    ErrorBoundary: ErrorScreen,
    HydrateFallback: RouteFallback
  }
]
