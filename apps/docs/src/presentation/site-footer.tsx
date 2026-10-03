import type React from 'react'

import { REPOSITORY_URL } from '@/features/packages/repository'
import { OutboundIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/ui/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './site-footer.sass'

const REPOSITORY_LABEL = REPOSITORY_URL.replace(/^https:\/\//, '')

export const SiteFooter: React.FC = () => {
  const translate = useTranslate()

  return (
    <footer className='site-footer'>
      <span>{translate('footer.source')}</span>
      <Link className='site-footer-link' href={REPOSITORY_URL}>
        {REPOSITORY_LABEL}
        <OutboundIcon />
      </Link>
    </footer>
  )
}
