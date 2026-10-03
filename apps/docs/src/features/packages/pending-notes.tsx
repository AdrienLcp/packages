import type React from 'react'

import { EmptySlotIcon } from '@/presentation/components/icons'
import { RenderedHtml } from '@/presentation/components/rendered-html'
import { StateRow } from '@/presentation/components/state-row'
import { Tag } from '@/presentation/components/tag'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { HousePackage, PendingNote } from './house-package.ts'
import { PackageMark } from './package-mark.tsx'

import './pending-notes.sass'

/** A pending note, with the package it will ship in when the list spans several. */
export type ListedPendingNote = PendingNote & {
  housePackage: HousePackage | null
}

type PendingNotesProps = {
  /** Says what shows here once something is merged; shown when nothing is. */
  emptyText: string
  notes: readonly ListedPendingNote[]
}

/** The changes merged since the last release, in their authors' words. */
export const PendingNotes: React.FC<PendingNotesProps> = ({
  emptyText,
  notes
}) => {
  const translate = useTranslate()

  if (notes.length === 0) {
    return (
      <div className='pending-notes'>
        <StateRow icon={<EmptySlotIcon />} title={translate('pending.nothing')}>
          {emptyText}
        </StateRow>
      </div>
    )
  }

  return (
    <ul className='pending-notes'>
      {notes.map(({ bump, housePackage, html }) => (
        <li className='pending-note' key={`${housePackage?.name ?? ''}${html}`}>
          <div className='pending-note-line'>
            {housePackage !== null && (
              <>
                <PackageMark housePackage={housePackage} />
                <span className='pending-note-package'>
                  {housePackage.name}
                </span>
              </>
            )}
            <Tag variant={bump}>{translate(`versions.bump.${bump}`)}</Tag>
          </div>
          <RenderedHtml className='pending-note-text' html={html} />
        </li>
      ))}
    </ul>
  )
}
