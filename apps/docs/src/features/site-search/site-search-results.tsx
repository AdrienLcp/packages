import type React from 'react'
import {
  Header,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Text
} from 'react-aria-components'

import { CATALOGUE } from '@/features/packages/catalogue-content'
import { PackageMark } from '@/features/packages/package-mark'
import { IconSquare } from '@/presentation/components/icon-square'
import { FileIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { ExcerptPart, SearchHit } from './search-hits'

const Excerpt: React.FC<{ parts: readonly ExcerptPart[] }> = ({ parts }) =>
  parts.map(({ isMatch, start, text }) =>
    isMatch ? <mark key={start}>{text}</mark> : <span key={start}>{text}</span>
  )

const plainTextOf = (parts: readonly ExcerptPart[]): string =>
  parts.map(({ text }) => text).join('')

const PageMark: React.FC<{ packageName: string | null }> = ({
  packageName
}) => {
  const housePackage = CATALOGUE.find(({ name }) => name === packageName)

  return housePackage === undefined ? (
    <IconSquare tone='neutral'>
      <FileIcon />
    </IconSquare>
  ) : (
    <PackageMark housePackage={housePackage} />
  )
}

/**
 * The pages a query found, each under its name, with the sections that hold
 * the match. The field keeps the keyboard: arrows move through the sections,
 * Enter opens the one in focus.
 */
export const SiteSearchResults: React.FC<{
  hits: readonly SearchHit[]
  /** Called as a section opens, so the dialog closes on the way. */
  onOpen: () => void
}> = ({ hits, onOpen }) => {
  const translate = useTranslate()

  return (
    <ListBox
      aria-label={translate('siteSearch.results')}
      className='site-search-results'
      onAction={onOpen}
    >
      {hits.map((hit) => (
        // Its own key space: a section and its first row can share a path.
        <ListBoxSection
          className='site-search-page'
          id={`page:${hit.href}`}
          key={hit.href}
        >
          <Header className='site-search-page-head'>
            <PageMark packageName={hit.packageName} />
            <span className='site-search-page-title'>{hit.title}</span>
          </Header>
          {hit.sections.map((section) => (
            <ListBoxItem
              className='site-search-hit'
              href={section.href}
              id={section.href}
              key={section.href}
              textValue={`${section.title ?? hit.title}: ${plainTextOf(section.excerpt)}`}
            >
              {section.title !== null && (
                <Text className='site-search-hit-title' slot='label'>
                  {section.title}
                </Text>
              )}
              <Text className='site-search-hit-excerpt' slot='description'>
                <Excerpt parts={section.excerpt} />
              </Text>
            </ListBoxItem>
          ))}
        </ListBoxSection>
      ))}
    </ListBox>
  )
}
