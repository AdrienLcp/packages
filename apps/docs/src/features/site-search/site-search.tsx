import type React from 'react'
import { useState } from 'react'
import {
  Autocomplete,
  Button,
  Dialog,
  DialogTrigger,
  Input,
  Modal,
  ModalOverlay,
  SearchField
} from 'react-aria-components'

import {
  CloseIcon,
  KeyDownIcon,
  KeyEnterIcon,
  KeyUpIcon,
  SearchIcon
} from '@/presentation/components/icons'
import { StateRow } from '@/presentation/components/state-row'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { SiteSearchResults } from './site-search-results'
import { type SiteSearchState, useSiteSearch } from './use-site-search'
import {
  useCommandKeyLabel,
  useSiteSearchShortcut
} from './use-site-search-shortcut'

import './site-search.sass'

const SHORTCUTS = '/ Control+K Meta+K'

/** What the live region reads out: a count once a query ran, nothing before. */
const StatusLine: React.FC<{ state: SiteSearchState }> = ({ state }) => {
  const translate = useTranslate()

  return (
    <p aria-live='polite' className='site-search-status'>
      {state.status === 'searching' && translate('siteSearch.searching')}
      {state.status === 'found' &&
        state.hits.length > 0 &&
        translate('siteSearch.pageCount', { count: state.hits.length })}
    </p>
  )
}

const SearchBody: React.FC<{
  closeSearch: () => void
  state: SiteSearchState
}> = ({ closeSearch, state }) => {
  const translate = useTranslate()

  if (state.status === 'unavailable') {
    return (
      <StateRow
        icon={<SearchIcon />}
        iconTone='hollow'
        title={translate('siteSearch.unavailable')}
      >
        {translate('siteSearch.unavailableBody')}
      </StateRow>
    )
  }

  if (state.status === 'idle') {
    return (
      <StateRow
        icon={<SearchIcon />}
        iconTone='hollow'
        title={translate('siteSearch.label')}
      >
        {translate('siteSearch.hint')}
      </StateRow>
    )
  }

  if (state.status === 'found' && state.hits.length === 0) {
    return (
      <StateRow
        icon={<SearchIcon />}
        iconTone='hollow'
        title={translate('siteSearch.noMatch', { query: state.query })}
      >
        {translate('siteSearch.noMatchBody')}
      </StateRow>
    )
  }

  return <SiteSearchResults hits={state.hits} onOpen={closeSearch} />
}

/** The field, what it found, and the keys that drive it; mounted only while open. */
const SearchPanel: React.FC<{ closeSearch: () => void }> = ({
  closeSearch
}) => {
  const translate = useTranslate()
  const { query, setQuery, state } = useSiteSearch()

  return (
    <Autocomplete inputValue={query} onInputChange={setQuery}>
      <div className='site-search-bar'>
        <SearchField
          aria-label={translate('siteSearch.label')}
          autoFocus
          className='site-search-field'
        >
          <SearchIcon className='site-search-field-icon' />
          <Input
            autoComplete='off'
            className='site-search-input'
            placeholder={translate('siteSearch.placeholder')}
            spellCheck={false}
          />
        </SearchField>
        <Button
          aria-label={translate('siteSearch.close')}
          className='site-search-close'
          onPress={closeSearch}
        >
          <kbd aria-hidden className='site-search-close-key'>
            Esc
          </kbd>
          <CloseIcon className='site-search-close-icon' />
        </Button>
      </div>
      <div className='site-search-body'>
        <SearchBody closeSearch={closeSearch} state={state} />
      </div>
      <div className='site-search-foot'>
        <StatusLine state={state} />
        <p
          aria-hidden
          className='site-search-keys'
          hidden={state.status !== 'found' || state.hits.length === 0}
        >
          <span>
            <kbd>
              <KeyUpIcon />
            </kbd>
            <kbd>
              <KeyDownIcon />
            </kbd>
            {translate('siteSearch.keyMove')}
          </span>
          <span>
            <kbd>
              <KeyEnterIcon />
            </kbd>
            {translate('siteSearch.keyOpen')}
          </span>
        </p>
      </div>
    </Autocomplete>
  )
}

/**
 * The search over every page's prose, from the header of every page: `/` or
 * Cmd/Ctrl K opens it, Escape clears the field then closes it.
 */
export const SiteSearch: React.FC = () => {
  const translate = useTranslate()
  const [isOpen, setOpen] = useState(false)
  const commandKey = useCommandKeyLabel()
  const openSearch = (): void => setOpen(true)
  const closeSearch = (): void => setOpen(false)

  useSiteSearchShortcut(openSearch)

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button aria-keyshortcuts={SHORTCUTS} className='site-search-trigger'>
        <SearchIcon className='site-search-trigger-icon' />
        <span className='site-search-trigger-label'>
          {translate('siteSearch.open')}
        </span>
        <kbd aria-hidden className='site-search-trigger-key'>
          {commandKey}
        </kbd>
      </Button>
      <ModalOverlay className='site-search-overlay' isDismissable>
        <Modal className='site-search-modal'>
          <Dialog
            aria-label={translate('siteSearch.label')}
            className='site-search-dialog'
          >
            <SearchPanel closeSearch={closeSearch} />
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
