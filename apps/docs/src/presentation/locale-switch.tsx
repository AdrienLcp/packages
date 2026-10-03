import type React from 'react'

import {
  pathInLocale,
  useCurrentPath
} from '@/infrastructure/router/navigation'
import { LinkRail, type LinkRailItem } from '@/presentation/components/ui/rail'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { LOCALE_NAMES, LOCALES, type Locale } from '@/presentation/i18n/locale'

/**
 * Links rather than toggles: another language is another document, so
 * crawlers and a middle click must find a real `<a hreflang>`.
 */
export const LocaleSwitch: React.FC = () => {
  const { locale, translate } = useI18n()
  const pathname = useCurrentPath()
  const items: LinkRailItem<Locale>[] = LOCALES.flatMap((slotLocale) => {
    const href = pathInLocale({ locale: slotLocale, pathname })

    return href === null
      ? []
      : {
          href,
          hrefLang: slotLocale,
          id: slotLocale,
          label: slotLocale.toUpperCase(),
          lang: slotLocale,
          name: LOCALE_NAMES[slotLocale]
        }
  })

  if (items.length === 0) {
    return null
  }

  return (
    <LinkRail
      aria-label={translate('locale.label')}
      className='locale-switch'
      currentId={locale}
      items={items}
      routerOptions={{ replace: true }}
    />
  )
}
