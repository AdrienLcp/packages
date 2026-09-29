import { describe, expect, it, vi } from 'vitest'

import { applyInitialLocale } from './apply-initial-locale.ts'
import {
  localeInPath,
  localizedPathFor,
  pathInLocale
} from './locale-in-path.ts'
import { negotiateLocale } from './negotiate-locale.ts'

const LOCALES = ['en', 'fr'] as const

describe('localeInPath', () => {
  it('[path] reads the locale named by the first segment', () => {
    expect(localeInPath('/fr/about', LOCALES)).toBe('fr')
    expect(localeInPath('/en', LOCALES)).toBe('en')
  })

  it('[path] is null when the first segment is no supported locale', () => {
    expect(localeInPath('/de/about', LOCALES)).toBeNull()
    expect(localeInPath('/play/ABCD', LOCALES)).toBeNull()
    expect(localeInPath('/', LOCALES)).toBeNull()
  })

  it('[path] does not read a locale further down the path', () => {
    expect(localeInPath('/about/fr', LOCALES)).toBeNull()
  })
})

describe('pathInLocale', () => {
  it('[path] moves the same page to another locale', () => {
    expect(
      pathInLocale({ locale: 'en', locales: LOCALES, pathname: '/fr/cv/plain' })
    ).toBe('/en/cv/plain')
    expect(
      pathInLocale({ locale: 'en', locales: LOCALES, pathname: '/fr' })
    ).toBe('/en')
  })

  it('[path] is null on a path that names no locale', () => {
    expect(
      pathInLocale({ locale: 'en', locales: LOCALES, pathname: '/play/ABCD' })
    ).toBeNull()
  })
})

describe('localizedPathFor', () => {
  it('[path] prefixes a path with the locale', () => {
    expect(localizedPathFor({ locale: 'fr', pathname: '/about' })).toBe(
      '/fr/about'
    )
  })

  it("[path] sends the root to the locale's home, with no trailing slash", () => {
    expect(localizedPathFor({ locale: 'fr', pathname: '/' })).toBe('/fr')
  })
})

describe('applyInitialLocale', () => {
  const i18n = {
    locales: LOCALES,
    negotiate: (preferred: readonly string[]) =>
      negotiateLocale(preferred, { fallback: 'en', supported: LOCALES })
  }

  const openOn = ({
    pathname,
    preferred = ['en-US'],
    stored = null
  }: {
    pathname: string
    preferred?: readonly string[]
    stored?: string | null
  }) => {
    const root = { lang: 'en' }
    const rememberLocale = vi.fn()
    const locale = applyInitialLocale({
      i18n,
      pathname,
      preferred,
      readStoredLocale: () => stored,
      rememberLocale,
      root
    })

    return { locale, rememberLocale, root }
  }

  it('[initial] the URL wins over the stored choice, and is remembered', () => {
    const opened = openOn({ pathname: '/fr/about', stored: 'en' })

    expect(opened.locale).toBe('fr')
    expect(opened.root.lang).toBe('fr')
    expect(opened.rememberLocale).toHaveBeenCalledWith('fr')
  })

  it('[initial] a URL naming no locale opens on the stored choice', () => {
    const opened = openOn({ pathname: '/play/ABCD', stored: 'fr' })

    expect(opened.locale).toBe('fr')
    expect(opened.root.lang).toBe('fr')
  })

  it('[initial] with nothing stored, the browser decides and nothing is remembered', () => {
    const opened = openOn({ pathname: '/', preferred: ['fr-CA'] })

    expect(opened.locale).toBe('fr')
    expect(opened.rememberLocale).not.toHaveBeenCalled()
  })

  it('[initial] a stored locale this version does not ship counts as none', () => {
    const opened = openOn({
      pathname: '/',
      preferred: ['fr-FR'],
      stored: 'de'
    })

    expect(opened.locale).toBe('fr')
  })
})
