import type React from 'react'

import { I18nProvider } from '@/presentation/i18n/i18n-provider'
import type { Locale } from '@/presentation/i18n/locale'

type AppProvidersProps = {
  children: React.ReactNode
  locale: Locale
}

/** Everything above the router, so a prerender can mount the same stack. */
export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  locale
}) => <I18nProvider locale={locale}>{children}</I18nProvider>
