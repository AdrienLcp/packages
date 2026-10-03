import {
  generatePath,
  isRouteErrorResponse,
  type PathParam,
  useLoaderData,
  useLocation,
  useRouteError,
  useSearchParams
} from 'react-router'

import { isLocale, type Locale } from '@/presentation/i18n/locale'

/**
 * Every indexable page names its language, because a search index keeps one
 * document per URL and never varies `Accept-Language`.
 */
export const localizedPaths = {
  home: '/:locale',
  package: '/:locale/:packageName'
} as const

export const paths = {
  ...localizedPaths,
  /** What `hreflang="x-default"` points at: it negotiates and redirects. */
  root: '/'
} as const

/**
 * A record over `PathParam` rather than `generatePath`'s own params type, which
 * accepts any name in silence: a missing or misspelled param fails to compile.
 */
const pathFor = <TPath extends string>(
  path: TPath,
  params: Record<PathParam<TPath>, string>
): string => generatePath<string>(path, params)

export const homePathFor = (locale: Locale): string =>
  pathFor(paths.home, { locale })

export const packagePathFor = ({
  locale,
  packageName
}: {
  locale: Locale
  packageName: string
}): string => pathFor(paths.package, { locale, packageName })

/** The loader's data, typed from the loader itself. */
export const useRouteData = <TLoader extends (...args: never[]) => unknown>() =>
  useLoaderData<TLoader>()

export const localizedPathFor = ({
  locale,
  pathname
}: {
  locale: Locale
  pathname: string
}): string =>
  pathname === paths.root ? homePathFor(locale) : `/${locale}${pathname}`

export const localeInPath = (pathname: string): Locale | null => {
  const segment = pathname.split('/')[1]

  return segment !== undefined && isLocale(segment) ? segment : null
}

/** The same page in another language, or `null` on a path that names none. */
export const pathInLocale = ({
  locale,
  pathname
}: {
  locale: Locale
  pathname: string
}): string | null => {
  const [, first, ...rest] = pathname.split('/')

  return first !== undefined && isLocale(first)
    ? ['', locale, ...rest].join('/')
    : null
}

export const useCurrentPath = (): string => useLocation().pathname

/** The fragment a link landed on, without its `#`; empty when there is none. */
export const useCurrentFragment = (): string => useLocation().hash.slice(1)

/** The route error flattened to one line, whatever was thrown. */
export const useRouteFailure = (): string => {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }

  return error instanceof Error ? error.message : String(error)
}

/** The URL's query, as the current page sees it. */
export const useQueryParams = (): URLSearchParams => useSearchParams()[0]

/**
 * Writes the URL's query in place: no history entry per keystroke, and the
 * page keeps its scroll.
 */
export const useReplaceQueryParams = (): ((
  params: URLSearchParams
) => void) => {
  const [, setSearchParams] = useSearchParams()

  return (params) => {
    setSearchParams(params, { preventScrollReset: true, replace: true })
  }
}
