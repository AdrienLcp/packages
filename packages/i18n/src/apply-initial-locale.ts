import { localeInPath } from './locale-in-path.ts'

/**
 * The locale an app opens on, stamped on `<html lang>` before the first render:
 * the one its URL names, then the one this device chose last, then the one the
 * browser asks for.
 *
 * The URL leads because it is the only source somebody else can have chosen: a
 * link shared in French opens in French. A locale read from the URL is
 * remembered, so a page whose URL names none comes back in it; a negotiated one
 * never is, because "never chosen" is what keeps following the browser.
 *
 * Stamping belongs to the same call because a browser that finds
 * `lang="en"` over French text offers to translate the page, and a provider's
 * effect arrives a paint too late.
 *
 * Storage stays with the caller, so this library reads none: `readStoredLocale`
 * answers `null` when nothing usable is stored — nothing chosen, or storage
 * that cannot be read — and whatever it returns is checked against the
 * registry's locales.
 *
 * ```ts
 * applyInitialLocale({
 *   i18n,
 *   pathname: location.pathname,
 *   preferred: navigator.languages,
 *   readStoredLocale: () => storedLocaleOrNone(),
 *   rememberLocale: (locale) => writeStoredLocale(locale),
 *   root: document.documentElement
 * })
 * ```
 */
export const applyInitialLocale = <Locale extends string>({
  i18n,
  pathname,
  preferred,
  readStoredLocale,
  rememberLocale,
  root
}: {
  i18n: {
    locales: readonly Locale[]
    negotiate: (preferred: readonly string[]) => Locale
  }
  pathname: string
  preferred: readonly string[]
  readStoredLocale: () => string | null
  rememberLocale: (locale: Locale) => void
  root: { lang: string }
}): Locale => {
  const inUrl = localeInPath(pathname, i18n.locales)

  if (inUrl !== null) {
    rememberLocale(inUrl)
  }

  const locale =
    inUrl ??
    storedLocaleIfSupported(readStoredLocale(), i18n.locales) ??
    i18n.negotiate(preferred)

  root.lang = locale

  return locale
}

const storedLocaleIfSupported = <Locale extends string>(
  stored: string | null,
  locales: readonly Locale[]
): Locale | null => locales.find((locale) => locale === stored) ?? null
