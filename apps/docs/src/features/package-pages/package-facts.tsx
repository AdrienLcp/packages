import type React from 'react'

import { lastReleaseDateOf } from '@/features/packages/catalogue'
import type { HousePackage } from '@/features/packages/house-package'
import {
  packageFileUrlOf,
  packageFolderUrlOf
} from '@/features/packages/repository'
import { packagePathFor } from '@/infrastructure/router/navigation'
import { Link } from '@/presentation/components/ui/link'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import './package-facts.sass'

const CHANGELOG = 'CHANGELOG.md'

type FactProps = {
  children: React.ReactNode
  term: string
}

const Fact: React.FC<FactProps> = ({ children, term }) => (
  <div className='package-fact'>
    <dt>{term}</dt>
    <dd>{children}</dd>
  </div>
)

/** The package at a glance: version, release day, house dependencies, where its files are. */
export const PackageFacts: React.FC<{ housePackage: HousePackage }> = ({
  housePackage
}) => {
  const { locale, translate } = useI18n()
  const releaseDate = lastReleaseDateOf(housePackage)
  const hasChangelog = housePackage.versions.some(
    (packageVersion) => packageVersion.origin === 'changelog'
  )

  return (
    <dl className='package-facts'>
      <Fact term={translate('facts.version')}>{housePackage.version}</Fact>
      <Fact term={translate('facts.released')}>
        {releaseDate ?? translate('versions.byHand')}
      </Fact>
      <Fact term={translate('facts.dependsOn')}>
        {housePackage.dependsOn.length === 0
          ? translate('facts.nothing')
          : housePackage.dependsOn.map((dependency, index) => (
              <span key={dependency}>
                {index > 0 && ', '}
                <Link
                  className='package-fact-link'
                  href={packagePathFor({ locale, packageName: dependency })}
                >
                  {dependency}
                </Link>
              </span>
            ))}
      </Fact>
      <Fact term={translate('facts.changelog')}>
        {hasChangelog ? (
          <Link
            className='package-fact-link'
            href={packageFileUrlOf({
              directory: housePackage.name,
              file: CHANGELOG
            })}
          >
            {CHANGELOG}
          </Link>
        ) : (
          translate('facts.noChangelog')
        )}
      </Fact>
      <Fact term={translate('facts.source')}>
        <Link
          className='package-fact-link'
          href={packageFolderUrlOf(housePackage.name)}
        >
          packages/{housePackage.name}
        </Link>
      </Fact>
    </dl>
  )
}
