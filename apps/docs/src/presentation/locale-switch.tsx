import type React from 'react'

import { useCurrentPath } from '@/infrastructure/router/navigation'
import { LinkRail, type LinkRailItem } from '@/presentation/components/ui/rail'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import type { Locale } from '@/presentation/i18n/locale'
import { localeLinksFor } from '@/presentation/i18n/locale-links'

/**
 * Links rather than toggles: another language is another document, so
 * crawlers and a middle click must find a real `<a hreflang>`.
 */
export const LocaleSwitch: React.FC = () => {
  const { locale, translate } = useI18n()
  const items: LinkRailItem<Locale>[] = localeLinksFor(useCurrentPath()).map(
    (link) => ({
      href: link.href,
      hrefLang: link.locale,
      id: link.locale,
      label: link.locale.toUpperCase(),
      lang: link.locale,
      name: link.name
    })
  )

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
