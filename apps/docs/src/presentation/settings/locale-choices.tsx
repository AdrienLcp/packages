import type React from 'react'
import { useId } from 'react'
import { Link } from 'react-aria-components'

import { useCurrentPath } from '@/infrastructure/router/navigation'
import { CheckIcon } from '@/presentation/components/icons'
import {
  ariaCurrentLeftOutOfLinkProps,
  restoreHrefLangDroppedByReactAria
} from '@/presentation/components/ui/link-quirks'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { localeLinksFor } from '@/presentation/i18n/locale-links'

type LocaleChoicesProps = {
  /** Called as a language is followed, to put the settings away. */
  onFollow: () => void
}

/**
 * The language as a settings list. Each row is a link, as in the header's rail:
 * another language is another document.
 */
export const LocaleChoices: React.FC<LocaleChoicesProps> = ({ onFollow }) => {
  const { locale, translate } = useI18n()
  const links = localeLinksFor(useCurrentPath())
  const labelId = useId()

  if (links.length === 0) {
    return null
  }

  return (
    <nav aria-labelledby={labelId} className='settings-group'>
      <h3 className='settings-group-label' id={labelId}>
        {translate('settings.language')}
      </h3>
      <div className='settings-rows'>
        {links.map((link) => (
          <Link
            {...ariaCurrentLeftOutOfLinkProps(link.locale === locale, 'true')}
            className='settings-row'
            href={link.href}
            key={link.locale}
            lang={link.locale}
            onPress={onFollow}
            render={restoreHrefLangDroppedByReactAria(link.locale)}
            routerOptions={{ replace: true }}
          >
            <span className='settings-row-label'>{link.name}</span>
            <CheckIcon className='settings-row-check' />
          </Link>
        ))}
      </div>
    </nav>
  )
}
