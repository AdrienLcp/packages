/**
 * The locale a path names as its first segment — `/fr/about` names `fr` — or
 * `null` when that segment is not one of `locales`. Plain string work, so it
 * runs before any router exists: `<html lang>` has to be right before the
 * first render.
 */
export const localeInPath = <Locale extends string>(
  pathname: string,
  locales: readonly Locale[]
): Locale | null => {
  const firstSegment = pathname.split('/')[1]

  return locales.find((locale) => locale === firstSegment) ?? null
}

/**
 * The same page in another language — `/fr/about` to `/en/about` — or `null`
 * on a path that names no locale, which has no other-language twin to move to.
 */
export const pathInLocale = <Locale extends string>({
  locale,
  locales,
  pathname
}: {
  locale: Locale
  locales: readonly Locale[]
  pathname: string
}): string | null => {
  if (localeInPath(pathname, locales) === null) {
    return null
  }

  const [, , ...rest] = pathname.split('/')

  return ['', locale, ...rest].join('/')
}

/**
 * Where a path that names no locale belongs once one is chosen: `/about` to
 * `/fr/about`, and the root `/` to `/fr`, the locale's home. It is how the
 * root answers a visitor — negotiate, then redirect here.
 */
export const localizedPathFor = <Locale extends string>({
  locale,
  pathname
}: {
  locale: Locale
  pathname: string
}): string => (pathname === '/' ? `/${locale}` : `/${locale}${pathname}`)
