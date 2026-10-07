import type React from 'react'

import type { HousePackage } from '@/features/packages/house-package'
import { lastReleaseDateOf } from '@/features/packages/last-release-date'
import {
  packageFileUrlOf,
  packageFolderUrlOf
} from '@/features/packages/repository'
import { packagePathFor } from '@/infrastructure/router/navigation'
import { Link } from '@/presentation/components/ui/link'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import type { Locale } from '@/presentation/i18n/locale'

import './package-facts.sass'

const CHANGELOG = 'CHANGELOG.md'
const NPM_PACKAGE_URL = 'https://www.npmjs.com/package/'

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

type Dependency = {
  href: string
  name: string
}

const dependenciesOf = (
  housePackage: HousePackage,
  locale: Locale
): Dependency[] => [
  ...housePackage.dependsOn.map((packageName) => ({
    href: packagePathFor({ locale, packageName }),
    name: packageName
  })),
  ...housePackage.dependsOnElsewhere.map((packageName) => ({
    href: `${NPM_PACKAGE_URL}${packageName}`,
    name: packageName
  }))
]

/** The package at a glance: version, release day, dependencies, where its files are. */
export const PackageFacts: React.FC<{ housePackage: HousePackage }> = ({
  housePackage
}) => {
  const { locale, translate } = useI18n()
  const releaseDate = lastReleaseDateOf(housePackage)
  const dependencies = dependenciesOf(housePackage, locale)
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
        {dependencies.length === 0
          ? translate('facts.nothing')
          : dependencies.map((dependency, index) => (
              <span key={dependency.name}>
                {index > 0 && ', '}
                <Link className='package-fact-link' href={dependency.href}>
                  {dependency.name}
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
