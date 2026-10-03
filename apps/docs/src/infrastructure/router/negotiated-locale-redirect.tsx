import type React from 'react'
import { Navigate, useLocation } from 'react-router'

import { localizedPathFor } from '@/infrastructure/router/navigation'
import { useI18n } from '@/presentation/i18n/i18n-provider'

export const NegotiatedLocaleRedirect: React.FC = () => {
  const { locale } = useI18n()
  const { pathname } = useLocation()

  return <Navigate replace to={localizedPathFor({ locale, pathname })} />
}
