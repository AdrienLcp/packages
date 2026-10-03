import type React from 'react'
import { useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router'

import { localeInPath } from '@/infrastructure/router/navigation'
import { NegotiatedLocaleRedirect } from '@/infrastructure/router/negotiated-locale-redirect'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import type { Locale } from '@/presentation/i18n/locale'

const useAdoptUrlLocaleBeforePaint = (localeInUrl: Locale | null): void => {
  const { locale, setLocale } = useI18n()

  useLayoutEffect(() => {
    if (localeInUrl !== null && localeInUrl !== locale) {
      setLocale(localeInUrl)
    }
  }, [locale, localeInUrl, setLocale])
}

/**
 * The URL decides the language. `useLocation` rather than `useParams`: a
 * pathless layout has matched no param yet, and would read the locale as
 * absent and redirect forever.
 */
export const LocalePrefixedRoutes: React.FC = () => {
  const { pathname } = useLocation()
  const localeInUrl = localeInPath(pathname)

  useAdoptUrlLocaleBeforePaint(localeInUrl)

  if (localeInUrl === null) {
    return <NegotiatedLocaleRedirect />
  }

  return <Outlet />
}
