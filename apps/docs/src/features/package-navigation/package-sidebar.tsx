import type React from 'react'

import { CATALOGUE } from '@/features/packages/catalogue-content'
import {
  exportCountOf,
  exportFilterFrom,
  filterInventory,
  isFiltering
} from '@/features/packages/export-filter'
import { PackageMark } from '@/features/packages/package-mark'
import { pendingAcross } from '@/features/packages/pending-across'
import { PendingNotes } from '@/features/packages/pending-notes'
import {
  homePathFor,
  packagePathFor,
  useCurrentPath,
  useQueryParams
} from '@/infrastructure/router/navigation'
import { IconSquare } from '@/presentation/components/icon-square'
import { GridIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/ui/link'
import { ariaCurrentLeftOutOfLinkProps } from '@/presentation/components/ui/link-quirks'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import './package-sidebar.sass'

const TOTAL_EXPORTS = exportCountOf(CATALOGUE)
const SIDEBAR_TITLE_ID = 'package-sidebar-title'

/** The names the home's filter keeps, or `null` when nothing is filtered. */
const useKeptPackageNames = (isHome: boolean): ReadonlySet<string> | null => {
  const filter = exportFilterFrom(useQueryParams())

  if (!isHome || !isFiltering(filter)) {
    return null
  }

  return new Set(
    filterInventory(CATALOGUE, filter).map(
      ({ housePackage }) => housePackage.name
    )
  )
}

/**
 * The settings app's left pane: every export, then each package, then what is
 * pending. While the home is filtered, a package with no match fades out.
 */
export const PackageSidebar: React.FC = () => {
  const { locale, translate } = useI18n()
  const currentPath = useCurrentPath()
  const homePath = homePathFor(locale)
  const isHome = currentPath === homePath
  const keptNames = useKeptPackageNames(isHome)

  return (
    <nav aria-labelledby={SIDEBAR_TITLE_ID} className='package-sidebar'>
      <div className='sidebar-plane'>
        <Link
          {...ariaCurrentLeftOutOfLinkProps(isHome, 'page')}
          className='sidebar-row'
          href={homePath}
        >
          <IconSquare tone='neutral'>
            <GridIcon />
          </IconSquare>
          <span className='sidebar-row-name'>{translate('sidebar.all')}</span>
          <span className='sidebar-row-meta'>{TOTAL_EXPORTS}</span>
          <span aria-hidden className='sidebar-row-dot' />
        </Link>
      </div>
      <div>
        <h2 className='sidebar-label' id={SIDEBAR_TITLE_ID}>
          {translate('sidebar.title')}
        </h2>
        <ul className='sidebar-plane'>
          {CATALOGUE.map((housePackage) => {
            const href = packagePathFor({
              locale,
              packageName: housePackage.name
            })
            const isOut =
              keptNames !== null && !keptNames.has(housePackage.name)

            return (
              <li className='sidebar-item' key={housePackage.name}>
                <Link
                  {...ariaCurrentLeftOutOfLinkProps(
                    currentPath === href,
                    'page'
                  )}
                  className={isOut ? 'sidebar-row is-out' : 'sidebar-row'}
                  href={href}
                >
                  <PackageMark
                    housePackage={housePackage}
                    tone={isOut ? 'hollow' : 'mark'}
                  />
                  <span className='sidebar-row-name'>{housePackage.name}</span>
                  <span className='sidebar-row-meta'>
                    {isOut
                      ? translate('sidebar.noMatch')
                      : housePackage.version}
                  </span>
                  <span aria-hidden className='sidebar-row-dot' />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      <PendingNotes
        emptyText={translate('pending.everywhere')}
        notes={pendingAcross(CATALOGUE)}
      />
    </nav>
  )
}
