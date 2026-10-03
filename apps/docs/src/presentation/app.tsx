import type React from 'react'
import { StrictMode } from 'react'

import { BrowserRouterProvider } from '@/infrastructure/router/browser-router'
import { AppProviders } from '@/presentation/app-providers'
import type { Locale } from '@/presentation/i18n/locale'

type AppProps = { locale: Locale }

export const App: React.FC<AppProps> = ({ locale }) => (
  <StrictMode>
    <AppProviders locale={locale}>
      <BrowserRouterProvider />
    </AppProviders>
  </StrictMode>
)
