import { createSafeContext } from '@adrienlcp/react'
import type React from 'react'
import { useEffect, useState } from 'react'

import { writeStoredLocale } from '@/infrastructure/storage/preferences-storage'
import { I18nProvider as ReactAriaI18nProvider } from '@/presentation/components/ui/i18n-provider'

import { i18n } from './i18n'
import type { Locale } from './locale'
import { REGIONAL_LOCALES } from './regional-locales'
import type { Translate } from './translation'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  translate: Translate
}

export const [I18nContext, useI18n] =
  createSafeContext<I18nContextValue>('I18nProvider')

export const useTranslate = (): Translate => useI18n().translate

type I18nProviderProps = {
  children: React.ReactNode
  locale: Locale
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  locale: initialLocale
}) => {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const chooseLocale = (next: Locale): void => {
    setLocale(next)
    writeStoredLocale(next)
  }

  return (
    <I18nContext
      value={{
        locale,
        setLocale: chooseLocale,
        translate: i18n.translator(locale)
      }}
    >
      <ReactAriaI18nProvider locale={REGIONAL_LOCALES[locale]}>
        {children}
      </ReactAriaI18nProvider>
    </I18nContext>
  )
}
