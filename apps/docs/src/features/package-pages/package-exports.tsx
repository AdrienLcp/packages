import type React from 'react'

import { exportAnchorOf } from '@/features/packages/export-anchor'
import { ExportRow } from '@/features/packages/export-row'
import type {
  DocumentSection,
  HousePackage
} from '@/features/packages/house-package'
import { packageFolderUrlOf } from '@/features/packages/repository'
import { useCurrentFragment } from '@/infrastructure/router/navigation'
import { SectionLinkIcon } from '@/presentation/components/icons'
import { RenderedHtml } from '@/presentation/components/rendered-html'
import { Link } from '@/presentation/components/ui/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { exportsBySection } from './exports-by-section'

import './package-exports.sass'

type PackageExportsProps = {
  documentation: readonly DocumentSection[]
  housePackage: HousePackage
}

/** The package's exports under the section headings that explain them, each row leading there. */
export const PackageExports: React.FC<PackageExportsProps> = ({
  documentation,
  housePackage
}) => {
  const translate = useTranslate()
  const fragment = useCurrentFragment()
  const hasSeveralEntryPoints =
    new Set(
      housePackage.exports.map((packageExport) => packageExport.specifier)
    ).size > 1

  return (
    <div className='package-exports'>
      {exportsBySection({ documentation, exports: housePackage.exports }).map(
        ({ exports, section }) => {
          const sectionHref =
            section === null
              ? packageFolderUrlOf(housePackage.name)
              : `#${section.slug}`

          return (
            <div key={section?.slug ?? ''}>
              <h3 className='package-exports-label'>
                {section === null ? (
                  translate('exports.sourceOnly')
                ) : (
                  <Link className='package-exports-section' href={sectionHref}>
                    {section.titleHtml === null ? (
                      translate('docs.opening')
                    ) : (
                      <RenderedHtml
                        elementType='span'
                        html={section.titleHtml}
                      />
                    )}
                    <SectionLinkIcon />
                  </Link>
                )}
                <span>
                  {translate('inventory.exportCount', {
                    count: exports.length
                  })}
                </span>
              </h3>
              <ul className='package-exports-list'>
                {exports.map((packageExport) => {
                  const anchor = exportAnchorOf(packageExport)

                  return (
                    <li className='package-exports-item' key={anchor}>
                      <ExportRow
                        housePackage={housePackage}
                        href={sectionHref}
                        id={anchor}
                        isTarget={fragment === anchor}
                        packageExport={packageExport}
                        showSpecifier={hasSeveralEntryPoints}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        }
      )}
    </div>
  )
}
