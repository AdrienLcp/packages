import type React from 'react'

import { REPOSITORY_URL } from '@/features/packages/repository'
import { legalPathFor } from '@/infrastructure/router/navigation'
import { OutboundIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/ui/link'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'
import { AUTHOR } from '@/presentation/site-credits'

import './site-footer.sass'

/**
 * The foot of every page: who made the site, linked to his own, its source,
 * and the legal page the law requires.
 */
export const SiteFooter: React.FC = () => {
  const { locale, translate } = useI18n()

  const authorLink = (children: string): React.ReactNode => (
    <Link className='site-footer-link' href={AUTHOR.siteHref[locale]}>
      {children}
      <OutboundIcon />
    </Link>
  )

  return (
    <footer className='site-footer'>
      <p className='site-footer-credits'>
        <span>
          <RichText
            parts={translate.rich('footer.credit', {
              author: authorLink,
              name: AUTHOR.name
            })}
          />
        </span>
        <Link className='site-footer-link' href={REPOSITORY_URL}>
          {translate('footer.source')}
          <OutboundIcon />
        </Link>
      </p>
      <Link className='site-footer-link' href={legalPathFor(locale)}>
        {translate('footer.legal')}
      </Link>
    </footer>
  )
}
