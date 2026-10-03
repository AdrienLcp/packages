import type React from 'react'

import { homePathFor } from '@/infrastructure/router/navigation'
import { IconSquare } from '@/presentation/components/icon-square'
import { PackageIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/ui/link'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { LocaleSwitch } from '@/presentation/locale-switch'
import { SkipLink } from '@/presentation/skip-link'
import { ThemeSwitch } from '@/presentation/theme/theme-switch'

import './site-header.sass'

type SiteHeaderProps = {
  /** Beside the site's name: where the visitor is, when the page says so. */
  context?: React.ReactNode
}

/** The bar every screen keeps on top: the site's name back home, and the settings. */
export const SiteHeader: React.FC<SiteHeaderProps> = ({ context }) => {
  const { locale } = useI18n()

  return (
    <header className='site-header'>
      <SkipLink />
      <Link className='site-brand' href={homePathFor(locale)}>
        <IconSquare size='m' tone='neutral'>
          <PackageIcon />
        </IconSquare>
        <span className='site-brand-name'>
          @adrienlcp<span className='site-brand-scope'>/packages</span>
        </span>
      </Link>
      {context}
      <div className='site-settings'>
        <LocaleSwitch />
        <ThemeSwitch />
      </div>
    </header>
  )
}
