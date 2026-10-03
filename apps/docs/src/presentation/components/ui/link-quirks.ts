import { createElement } from 'react'
import type { LinkProps as ReactAriaLinkProps } from 'react-aria-components'

export const ariaCurrentLeftOutOfLinkProps = (
  isCurrent: boolean,
  value: 'page' | 'true'
): { 'aria-current'?: 'page' | 'true' } =>
  isCurrent ? { 'aria-current': value } : {}

/**
 * react-aria types `hrefLang` but leaves it off the `<a>` it renders, so it is
 * put back by hand: a crawler reads it to pair a page with its translation.
 */
export const restoreHrefLangDroppedByReactAria = (
  hrefLang: string | undefined
): ReactAriaLinkProps['render'] =>
  hrefLang === undefined
    ? undefined
    : (domProps) => createElement('a', { ...domProps, hrefLang })
