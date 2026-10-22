import { pathInLocale } from '@/infrastructure/router/navigation'

import { LOCALE_NAMES, LOCALES, type Locale } from './locale'

/** The page on screen, in one of the site's languages. */
export type LocaleLink = {
  href: string
  locale: Locale
  /** The language named in itself. */
  name: string
}

/** The page at `pathname` in every language; none when its path names no language. */
export const localeLinksFor = (pathname: string): LocaleLink[] =>
  LOCALES.flatMap((locale) => {
    const href = pathInLocale({ locale, pathname })

    return href === null ? [] : { href, locale, name: LOCALE_NAMES[locale] }
  })
