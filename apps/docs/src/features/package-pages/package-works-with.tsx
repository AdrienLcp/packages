import type React from 'react'

import type { EcosystemTie } from '@/features/packages/ecosystem'
import {
  ECOSYSTEM_TOOL_NAMES,
  EcosystemLogo
} from '@/features/packages/ecosystem-logo'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './package-works-with.sass'

/** The tools the package is written for, by their logos; an optional peer says so. */
export const PackageWorksWith: React.FC<{
  ecosystem: readonly EcosystemTie[]
}> = ({ ecosystem }) => {
  const translate = useTranslate()

  return (
    <ul className='package-works-with'>
      {ecosystem.map(({ isOptional, tool }) => (
        <li className='works-with-tool' key={tool}>
          <EcosystemLogo className='works-with-logo' tool={tool} />
          <span>
            <b className='works-with-name'>{ECOSYSTEM_TOOL_NAMES[tool]}</b>
            {isOptional && (
              <small className='works-with-note'>
                {translate('package.optionalPeer')}
              </small>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
