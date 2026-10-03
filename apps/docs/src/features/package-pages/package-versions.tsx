import type React from 'react'

import type { HousePackage } from '@/features/packages/house-package'
import { commitUrlOf } from '@/features/packages/repository'
import { EmptySlotIcon } from '@/presentation/components/icons'
import { RenderedHtml } from '@/presentation/components/rendered-html'
import { StateRow } from '@/presentation/components/state-row'
import { Tag } from '@/presentation/components/tag'
import { Link } from '@/presentation/components/ui/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './package-versions.sass'

/** Every version, newest first, with its notes in the changelog's own words. */
export const PackageVersions: React.FC<{ housePackage: HousePackage }> = ({
  housePackage
}) => {
  const translate = useTranslate()

  return (
    <>
      <ol className='package-versions'>
        {housePackage.versions.map((packageVersion, index) => (
          <li className='package-version' key={packageVersion.version}>
            <div className='package-version-line'>
              <span className='package-version-number'>
                {packageVersion.version}
              </span>
              {packageVersion.origin === 'hand' ? (
                <Tag variant='hand'>{translate('versions.byHand')}</Tag>
              ) : (
                <Tag variant={packageVersion.bump}>
                  {translate(`versions.bump.${packageVersion.bump}`)}
                </Tag>
              )}
              {index === 0 && (
                <Tag variant='newest'>{translate('versions.latest')}</Tag>
              )}
              {packageVersion.origin === 'changelog' &&
                packageVersion.date !== null && (
                  <span className='package-version-date'>
                    {packageVersion.date}
                  </span>
                )}
            </div>
            {packageVersion.origin === 'hand' ? (
              <StateRow
                icon={<EmptySlotIcon />}
                title={translate('versions.noNotes')}
              >
                {translate('versions.noNotesBody')}
              </StateRow>
            ) : (
              <ul className='package-version-notes'>
                {packageVersion.notes.map((note) => (
                  <li
                    className='package-version-note'
                    key={`${note.commit ?? ''}${note.html}`}
                  >
                    {note.commit !== null && (
                      <Link
                        className='package-version-commit'
                        href={commitUrlOf(note.commit)}
                      >
                        {note.commit}
                      </Link>
                    )}
                    <RenderedHtml
                      className='package-version-text'
                      html={note.html}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      {housePackage.handPublishedBefore !== null && (
        <p className='package-versions-footnote'>
          {translate('versions.handBefore', {
            version: housePackage.handPublishedBefore
          })}
        </p>
      )}
      <p className='package-versions-footnote'>{translate('versions.how')}</p>
    </>
  )
}
