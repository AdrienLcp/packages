import type React from 'react'

import { lastReleaseDateOf } from '@/features/packages/catalogue'
import { exportAnchorOf } from '@/features/packages/export-anchor'
import type {
  ExportFilter,
  FilteredPackage
} from '@/features/packages/export-filter'
import { ExportRow } from '@/features/packages/export-row'
import { PackageMark } from '@/features/packages/package-mark'
import { packagePathFor } from '@/infrastructure/router/navigation'
import { ChevronIcon } from '@/presentation/components/icons'
import { Tag } from '@/presentation/components/tag'
import { Link } from '@/presentation/components/ui/link'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import './export-inventory.sass'

type ExportInventoryProps = {
  filter: ExportFilter
  /** Shown with the newest-release tag, while nothing is filtered. */
  newestName: string | null
  packages: readonly FilteredPackage[]
}

/** Every export the filter keeps, one grouped list per package. */
export const ExportInventory: React.FC<ExportInventoryProps> = ({
  filter,
  newestName,
  packages
}) => {
  const { locale, translate } = useI18n()

  return (
    <div className='export-inventory'>
      {packages.map(({ exports, housePackage }) => {
        const packagePath = packagePathFor({
          locale,
          packageName: housePackage.name
        })
        const headingId = `inventory-${housePackage.name}`
        const releaseDate = lastReleaseDateOf(housePackage)

        return (
          <section
            aria-labelledby={headingId}
            className='inventory-group'
            key={housePackage.name}
          >
            <Link className='inventory-package' href={packagePath}>
              <PackageMark housePackage={housePackage} size='l' />
              <span className='inventory-package-main'>
                <span className='inventory-package-title'>
                  <h3 className='inventory-package-name' id={headingId}>
                    <span className='inventory-package-scope'>@adrienlcp/</span>
                    {housePackage.name}
                  </h3>
                  {housePackage.name === newestName && (
                    <Tag variant='newest'>{translate('inventory.newest')}</Tag>
                  )}
                </span>
                <span className='inventory-package-description'>
                  {housePackage.description}
                </span>
              </span>
              <span className='inventory-package-facts'>
                <b>{housePackage.version}</b>
                {releaseDate !== null && <span>{releaseDate}</span>}
                <span>
                  {translate('inventory.exportCount', {
                    count: exports.length
                  })}
                </span>
              </span>
              <ChevronIcon className='inventory-package-chevron' />
            </Link>
            <ul className='inventory-exports'>
              {exports.map((packageExport) => (
                <li
                  className='inventory-export'
                  key={`${packageExport.specifier} ${packageExport.name}`}
                >
                  <ExportRow
                    filter={filter}
                    housePackage={housePackage}
                    href={`${packagePath}#${exportAnchorOf(packageExport)}`}
                    packageExport={packageExport}
                    showSpecifier
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
