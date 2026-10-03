import type React from 'react'

import { lastReleaseDateOf } from '@/features/packages/catalogue'
import {
  exportCountOf,
  filterInventory,
  isFiltering,
  kindCountsOf
} from '@/features/packages/export-filter'
import { pendingAcross } from '@/features/packages/pending-across'
import { PendingNotes } from '@/features/packages/pending-notes'
import { SearchIcon } from '@/presentation/components/icons'
import { Main } from '@/presentation/components/main'
import { StateRow } from '@/presentation/components/state-row'
import { TextButton } from '@/presentation/components/ui/text-button'
import { VisuallyHidden } from '@/presentation/components/ui/visually-hidden'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ExportInventory } from './export-inventory'
import { ExportToolbar } from './export-toolbar'
import { useHomeData } from './home-loader'
import { useExportFilter } from './use-export-filter'

import './home-page.sass'

/** Every export of every package, searchable and filterable by kind. */
export const HomePage: React.FC = () => {
  const translate = useTranslate()
  const { packages } = useHomeData()
  const exportFilter = useExportFilter()
  const { clearFilter, filter } = exportFilter
  const kept = filterInventory(packages, filter)
  const totalCount = exportCountOf(packages)
  const shownCount = exportCountOf(kept)
  const [newest] = packages
  const newestDate = newest === undefined ? null : lastReleaseDateOf(newest)

  return (
    <Main className='home-page'>
      <DocumentTitle>{translate('app.name')}</DocumentTitle>
      <div className='home-head'>
        <div>
          <h1 className='home-title'>{translate('home.title')}</h1>
          <p className='home-intro'>
            {translate('home.intro', { count: packages.length })}
          </p>
        </div>
        <p className='home-facts'>
          <span>
            <b>{totalCount}</b>{' '}
            {translate('home.exportNoun', { count: totalCount })}
          </span>
          <span>
            <b>{packages.length}</b>{' '}
            {translate('home.packageNoun', { count: packages.length })}
          </span>
          {newestDate !== null && (
            <span>
              {translate('home.lastRelease')} <b>{newestDate}</b>
            </span>
          )}
        </p>
      </div>
      <ExportToolbar
        exportFilter={exportFilter}
        kindCounts={kindCountsOf(packages)}
        shownCount={shownCount}
        totalCount={totalCount}
      />
      <div className='home-pending'>
        <PendingNotes
          emptyText={translate('pending.everywhere')}
          notes={pendingAcross(packages)}
        />
      </div>
      <VisuallyHidden elementType='h2'>
        {translate('inventory.caption')}
      </VisuallyHidden>
      {kept.length > 0 ? (
        <ExportInventory
          filter={filter}
          newestName={isFiltering(filter) ? null : (newest?.name ?? null)}
          packages={kept}
        />
      ) : (
        <div className='home-no-match'>
          <StateRow
            icon={<SearchIcon />}
            iconTone='hollow'
            title={
              filter.query.trim() === ''
                ? translate('empty.kindOnly')
                : translate('empty.query', { query: filter.query.trim() })
            }
          >
            {translate('empty.body')}
          </StateRow>
          <TextButton className='home-clear' onPress={clearFilter}>
            {translate('empty.clear')}
          </TextButton>
        </div>
      )}
    </Main>
  )
}
