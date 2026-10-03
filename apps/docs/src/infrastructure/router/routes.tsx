import type { LoaderFunction, RouteObject } from 'react-router'

import { NotFoundPage } from '@/features/not-found/not-found-page'
import { LocalePrefixedRoutes } from '@/infrastructure/router/locale-prefixed-routes'
import { localizedPaths } from '@/infrastructure/router/navigation'
import { NegotiatedLocaleRedirect } from '@/infrastructure/router/negotiated-locale-redirect'
import { RootRoute } from '@/infrastructure/router/root-route'
import { ErrorScreen } from '@/presentation/error-screen'
import { RouteFallback } from '@/presentation/route-fallback'

type LocalizedPath = (typeof localizedPaths)[keyof typeof localizedPaths]

type LazyPage = {
  lazy: RouteObject['lazy']
  /**
   * How Vite's build manifest keys the chunk, which the prerender reads to link
   * its stylesheet.
   */
  module: string
  /** The loader's own module, imported on demand beside the page's chunk. */
  loaderModule: string
}

/** Keyed by path, so a path with no page fails to compile. */
const pageFor = {
  [localizedPaths.home]: {
    lazy: async () => ({
      Component: (await import('@/features/home/home-page')).HomePage
    }),
    loaderModule: 'src/features/home/home-loader.ts',
    module: 'src/features/home/home-page.tsx'
  },
  [localizedPaths.package]: {
    lazy: async () => ({
      Component: (await import('@/features/package-pages/package-page'))
        .PackagePage
    }),
    loaderModule: 'src/features/package-pages/package-loader.ts',
    module: 'src/features/package-pages/package-page.tsx'
  }
} satisfies Record<LocalizedPath, LazyPage>

export const pageModuleFor = (path: LocalizedPath): string =>
  pageFor[path].module

export const loaderModuleFor = (path: LocalizedPath): string =>
  pageFor[path].loaderModule

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
  lazy: pageFor[path].lazy,
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
