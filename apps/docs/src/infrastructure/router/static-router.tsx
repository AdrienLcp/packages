import { prerender } from 'react-dom/static'
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider
} from 'react-router'

import { AppProviders } from '@/presentation/app-providers'
import type { Locale } from '@/presentation/i18n/locale'

import { routes } from './routes'

const handler = createStaticHandler(routes)

const WAIT_FOR_EVERY_BOUNDARY_IN_PLACE = {
  progressiveChunkSize: Number.POSITIVE_INFINITY
}

/** Every region that is still waiting paints one of these. */
const PENDING_MARKERS = ['aria-busy="true"', '<template']

/**
 * `prerender` rather than `renderToStaticMarkup`: it waits for every Suspense
 * boundary to resolve instead of writing its fallback into the document.
 */
export const prerenderPath = async ({
  locale,
  path
}: {
  locale: Locale
  path: string
}): Promise<string> => {
  const context = await handler.query(new Request(`http://prerender${path}`))

  if (context instanceof Response) {
    throw new Error(
      `${path} answered with ${context.status} rather than with a page`
    )
  }

  const lazyResolvedRoutes = handler.dataRoutes
  const { prelude } = await prerender(
    <AppProviders locale={locale}>
      <StaticRouterProvider
        context={context}
        hydrate={false}
        router={createStaticRouter(lazyResolvedRoutes, context)}
      />
    </AppProviders>,
    WAIT_FOR_EVERY_BOUNDARY_IN_PLACE
  )
  const html = await new Response(prelude).text()

  if (PENDING_MARKERS.some((marker) => html.includes(marker))) {
    throw new Error(`${path} rendered a pending state rather than its content`)
  }

  return html
}
