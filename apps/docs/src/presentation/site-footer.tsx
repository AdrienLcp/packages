import type React from 'react'

import { REPOSITORY_URL } from '@/features/packages/repository'
import { legalPathFor } from '@/infrastructure/router/navigation'
import { OutboundIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/ui/link'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import './site-footer.sass'

const REPOSITORY_LABEL = REPOSITORY_URL.replace(/^https:\/\//, '')

export const SiteFooter: React.FC = () => {
  const { locale, translate } = useI18n()

  return (
    <footer className='site-footer'>
      <p className='site-footer-source'>
        <span>{translate('footer.source')}</span>
        <Link className='site-footer-link' href={REPOSITORY_URL}>
          {REPOSITORY_LABEL}
          <OutboundIcon />
        </Link>
      </p>
      <Link className='site-footer-link' href={legalPathFor(locale)}>
        {translate('footer.legal')}
      </Link>
    </footer>
  )
}
