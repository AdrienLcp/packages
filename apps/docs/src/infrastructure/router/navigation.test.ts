import { describe, expect, it } from 'vitest'

import {
  localeInPath,
  localizedPathFor,
  packagePathFor,
  pathInLocale
} from './navigation'

describe('navigation', () => {
  it('[navigation] reads the locale from the first segment only', () => {
    expect(localeInPath('/fr/i18n')).toBe('fr')
    expect(localeInPath('/i18n/fr')).toBeNull()
    expect(localeInPath('/')).toBeNull()
  })

  it('[navigation] swaps the locale and keeps the rest of the path', () => {
    expect(pathInLocale({ locale: 'fr', pathname: '/en/i18n' })).toBe(
      '/fr/i18n'
    )
  })

  it('[navigation] offers no translation of a path without a locale', () => {
    expect(pathInLocale({ locale: 'fr', pathname: '/i18n' })).toBeNull()
  })

  it('[navigation] sends the root to the home page of the negotiated locale', () => {
    expect(localizedPathFor({ locale: 'fr', pathname: '/' })).toBe('/fr')
    expect(localizedPathFor({ locale: 'en', pathname: '/i18n' })).toBe(
      '/en/i18n'
    )
  })

  it('[navigation] percent-encodes a package name', () => {
    expect(packagePathFor({ locale: 'en', packageName: 'a/b' })).toBe(
      '/en/a%2Fb'
    )
  })
})
