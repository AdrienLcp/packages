import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Input,
  SearchField as ReactAriaSearchField,
  type SearchFieldProps as ReactAriaSearchFieldProps
} from 'react-aria-components'

import { SearchIcon } from '../icons'

import './search-field.sass'

type SearchFieldProps = Omit<ReactAriaSearchFieldProps, 'children'> & {
  /** Named for assistive technology; the placeholder shows instead. */
  label: string
  placeholder: string
  /** A key that focuses the field from anywhere on the page, shown at its end. */
  shortcut?: string
  inputRef?: React.Ref<HTMLInputElement>
}

/** The raised search field at the top of a list. Escape clears it. */
export const SearchField: React.FC<SearchFieldProps> = ({
  className,
  inputRef,
  label,
  placeholder,
  shortcut,
  ...props
}) => (
  <ReactAriaSearchField
    {...props}
    aria-label={label}
    className={composeClassName(className, 'search-field')}
  >
    <SearchIcon className='search-field-icon' />
    <Input
      autoComplete='off'
      className='search-field-input'
      placeholder={placeholder}
      ref={inputRef}
      spellCheck={false}
    />
    {shortcut !== undefined && (
      <kbd aria-hidden className='search-field-shortcut'>
        {shortcut}
      </kbd>
    )}
  </ReactAriaSearchField>
)
