import { CATALOGUE } from '@/features/packages/catalogue-content'
import {
  homePathFor,
  localizedPaths,
  packagePathFor
} from '@/infrastructure/router/navigation'
import { loaderModuleFor, pageModuleFor } from '@/infrastructure/router/routes'
import { prerenderPath } from '@/infrastructure/router/static-router'
import { i18n } from '@/presentation/i18n/i18n'
import { LOCALES, type Locale } from '@/presentation/i18n/locale'

export type PrerenderedPage = {
  /** The search snippet, and the line a link unfurls with. */
  description: string
  locale: Locale
  /**
   * How Vite's build manifest keys the chunks this page runs: its own, then
   * its loader's, preloaded so the app takes over without another round trip.
   */
  modules: string[]
  /** Where the document is served, from the site root: `/fr/i18n`. */
  path: string
}

const homeFor = (locale: Locale): PrerenderedPage => ({
  description: i18n.translator(locale)('app.description'),
  locale,
  modules: [
    pageModuleFor(localizedPaths.home),
    loaderModuleFor(localizedPaths.home)
  ],
  path: homePathFor(locale)
})

const packagePagesFor = (locale: Locale): PrerenderedPage[] =>
  CATALOGUE.map((housePackage) => ({
    description: housePackage.description,
    locale,
    modules: [
      pageModuleFor(localizedPaths.package),
      loaderModuleFor(localizedPaths.package)
    ],
    path: packagePathFor({ locale, packageName: housePackage.name })
  }))

/** Read off the catalogue, so a package added there gets its own documents. */
export const prerenderedPages: PrerenderedPage[] = LOCALES.flatMap((locale) => [
  homeFor(locale),
  ...packagePagesFor(locale)
])

/**
 * What React rendered: the page's `<title>` first, then what goes inside
 * `#root`, so there is something to paint before any script runs.
 */
export const renderPage = (page: PrerenderedPage): Promise<string> =>
  prerenderPath(page)
