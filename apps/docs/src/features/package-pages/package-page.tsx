import type React from 'react'

import { NotFoundPage } from '@/features/not-found/not-found-page'
import { PackageMark } from '@/features/packages/package-mark'
import { PendingNotes } from '@/features/packages/pending-notes'
import { homePathFor } from '@/infrastructure/router/navigation'
import { BackIcon } from '@/presentation/components/icons'
import { Main } from '@/presentation/components/main'
import { Link } from '@/presentation/components/ui/link'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import { PackageDocumentation } from './package-documentation'
import { PackageExports } from './package-exports'
import { PackageFacts } from './package-facts'
import { PackageInstall } from './package-install'
import { usePackageData } from './package-loader'
import { PACKAGE_TITLE_ID } from './package-title-id'
import { PackageVersions } from './package-versions'
import { PackageWorksWith } from './package-works-with'

import './package-page.sass'

const SECTION_IDS = {
  documentation: 'package-documentation',
  exports: 'package-exports',
  pending: 'package-pending',
  versions: 'package-versions'
} as const

/** One package: what it works with, how to install it, its exports, its documents, its versions. */
export const PackagePage: React.FC = () => {
  const { locale, translate } = useI18n()
  const { documentation, documentedPackage } = usePackageData()

  if (documentedPackage === null) {
    return <NotFoundPage />
  }

  const housePackage = documentedPackage

  return (
    <Main aria-labelledby={PACKAGE_TITLE_ID} className='package-page'>
      <DocumentTitle>{`${housePackage.scopedName} — ${translate('app.name')}`}</DocumentTitle>
      <Link className='package-back' href={homePathFor(locale)}>
        <BackIcon />
        <span>{translate('package.back')}</span>
      </Link>
      <div className='package-head'>
        <PackageMark housePackage={housePackage} size='xl' />
        <h1 className='package-title' id={PACKAGE_TITLE_ID}>
          <span className='package-scope'>@adrienlcp/</span>
          <span className='package-name'>{housePackage.name}</span>
        </h1>
        <p className='package-description'>{housePackage.description}</p>
      </div>
      <div className='package-top'>
        <div>
          <h2 className='package-label'>{translate('package.worksWith')}</h2>
          <PackageWorksWith ecosystem={housePackage.ecosystem} />
        </div>
        <div>
          <h2 className='package-label'>{translate('install.title')}</h2>
          <PackageInstall command={housePackage.install} />
          <nav
            aria-label={translate('package.navigation')}
            className='package-jumps'
          >
            <a className='package-jump' href={`#${SECTION_IDS.exports}`}>
              {translate('exports.title')}
              <span className='package-jump-count'>
                {housePackage.exports.length}
              </span>
            </a>
            <a className='package-jump' href={`#${SECTION_IDS.documentation}`}>
              {translate('docs.title')}
            </a>
            <a className='package-jump' href={`#${SECTION_IDS.versions}`}>
              {translate('versions.title')}
              <span className='package-jump-count'>
                {housePackage.versions.length}
              </span>
            </a>
            <a className='package-jump' href={`#${SECTION_IDS.pending}`}>
              {translate('pending.title')}
              <span className='package-jump-count'>
                {housePackage.pending.length}
              </span>
            </a>
          </nav>
        </div>
      </div>
      <div className='package-body'>
        <div className='package-main'>
          <section
            aria-labelledby={`${SECTION_IDS.exports}-title`}
            id={SECTION_IDS.exports}
          >
            <div className='package-block-head'>
              <h2 id={`${SECTION_IDS.exports}-title`}>
                {translate('exports.title')}
              </h2>
              <p>{translate('exports.how')}</p>
            </div>
            <PackageExports
              documentation={documentation}
              housePackage={housePackage}
            />
          </section>
          <section
            aria-labelledby={`${SECTION_IDS.documentation}-title`}
            id={SECTION_IDS.documentation}
          >
            <div className='package-block-head'>
              <h2 id={`${SECTION_IDS.documentation}-title`}>
                {translate('docs.title')}
              </h2>
              <p>{translate('docs.how')}</p>
            </div>
            <PackageDocumentation documentation={documentation} />
          </section>
        </div>
        <aside className='package-side'>
          <section aria-labelledby='package-facts-title'>
            <h2 className='package-side-title' id='package-facts-title'>
              {translate('facts.title')}
            </h2>
            <PackageFacts housePackage={housePackage} />
          </section>
          <section
            aria-labelledby={`${SECTION_IDS.pending}-title`}
            id={SECTION_IDS.pending}
          >
            <h2
              className='package-side-title'
              id={`${SECTION_IDS.pending}-title`}
            >
              {translate('pending.title')}
            </h2>
            <PendingNotes
              emptyText={translate('pending.inPackage', {
                name: housePackage.name,
                version: housePackage.version
              })}
              notes={housePackage.pending.map((note) => ({
                ...note,
                housePackage: null
              }))}
            />
          </section>
          <section
            aria-labelledby={`${SECTION_IDS.versions}-title`}
            id={SECTION_IDS.versions}
          >
            <h2
              className='package-side-title'
              id={`${SECTION_IDS.versions}-title`}
            >
              {translate('versions.title')}
            </h2>
            <PackageVersions housePackage={housePackage} />
          </section>
        </aside>
      </div>
    </Main>
  )
}
