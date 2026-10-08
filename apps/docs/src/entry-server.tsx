import { CATALOGUE } from '@/features/packages/catalogue-content'
import { packageFolderUrlOf } from '@/features/packages/repository'
import {
  homePathFor,
  localizedPaths,
  packagePathFor,
  paths
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
  /** The schema.org object the page is, written as JSON-LD; the prerender adds its `url`. */
  structuredData: StructuredData
  /** The same page in every locale, itself included, for the `hreflang` alternates. */
  translations: PageTranslation[]
  /** What `hreflang="x-default"` names: the path that negotiates the locale, when the page has one. */
  xDefaultPath: string | null
}

export type StructuredData = {
  '@type': 'SoftwareSourceCode' | 'WebSite'
  [property: string]: string
}

export type PageTranslation = {
  locale: Locale
  path: string
}

const translationsOf = (
  pathIn: (locale: Locale) => string
): PageTranslation[] =>
  LOCALES.map((locale) => ({ locale, path: pathIn(locale) }))

const homeFor = (locale: Locale): PrerenderedPage => {
  const translate = i18n.translator(locale)

  return {
    description: translate('app.description'),
    locale,
    modules: [
      pageModuleFor(localizedPaths.home),
      loaderModuleFor(localizedPaths.home)
    ],
    path: homePathFor(locale),
    structuredData: {
      '@type': 'WebSite',
      description: translate('app.description'),
      inLanguage: locale,
      name: translate('app.name')
    },
    translations: translationsOf(homePathFor),
    xDefaultPath: paths.root
  }
}

const packagePagesFor = (locale: Locale): PrerenderedPage[] =>
  CATALOGUE.map((housePackage) => ({
    description: housePackage.description,
    locale,
    modules: [
      pageModuleFor(localizedPaths.package),
      loaderModuleFor(localizedPaths.package)
    ],
    path: packagePathFor({ locale, packageName: housePackage.name }),
    structuredData: {
      '@type': 'SoftwareSourceCode',
      codeRepository: packageFolderUrlOf(housePackage.name),
      description: housePackage.description,
      inLanguage: locale,
      name: housePackage.scopedName,
      programmingLanguage: 'TypeScript'
    },
    translations: translationsOf((translated) =>
      packagePathFor({ locale: translated, packageName: housePackage.name })
    ),
    xDefaultPath: null
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
