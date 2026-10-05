import { describe, expect, it } from 'vitest'

import { pathSlugOf, shotFileNameOf } from './shot-file-name.ts'
import { shotVariantsOf } from './shot-variant.ts'
import { storageEntriesOf } from './storage-entries.ts'

describe('pathSlugOf', () => {
  it.each([
    ['/', 'home'],
    ['/settings', 'settings'],
    ['/deputes/PA793214', 'deputes_PA793214'],
    ['/?period=7d', 'home_period_7d'],
    ['/votes/8434?view=camps#vote', 'votes_8434_view_camps_vote'],
    ['/en/projects/', 'en_projects']
  ])('[shot-file-name] names %s %s', (path, slug) => {
    expect(pathSlugOf(path)).toBe(slug)
  })
})

describe('shotFileNameOf', () => {
  it('[shot-file-name] orders path, locale, theme, width', () => {
    expect(
      shotFileNameOf({
        path: '/settings',
        variant: { locale: 'fr', theme: 'dark', width: 360 }
      })
    ).toBe('settings.fr.dark.360.png')
  })

  it('[shot-file-name] leaves out what the run does not vary', () => {
    expect(
      shotFileNameOf({
        path: '/',
        variant: { locale: null, theme: null, width: 320 }
      })
    ).toBe('home.320.png')
  })
})

describe('shotVariantsOf', () => {
  it('[shot-variant] crosses every width, locale and theme, widths outermost', () => {
    expect(
      shotVariantsOf({
        locales: ['en', 'fr'],
        themes: ['light', 'dark'],
        widths: [320, 360]
      })
    ).toEqual([
      { locale: 'en', theme: 'light', width: 320 },
      { locale: 'en', theme: 'dark', width: 320 },
      { locale: 'fr', theme: 'light', width: 320 },
      { locale: 'fr', theme: 'dark', width: 320 },
      { locale: 'en', theme: 'light', width: 360 },
      { locale: 'en', theme: 'dark', width: 360 },
      { locale: 'fr', theme: 'light', width: 360 },
      { locale: 'fr', theme: 'dark', width: 360 }
    ])
  })

  it('[shot-variant] gives one variant per width when nothing else varies', () => {
    expect(
      shotVariantsOf({ locales: [], themes: [], widths: [320, 360] })
    ).toEqual([
      { locale: null, theme: null, width: 320 },
      { locale: null, theme: null, width: 360 }
    ])
  })
})

describe('storageEntriesOf', () => {
  it('[storage-entries] writes the variant locale and theme over the fixtures', () => {
    expect(
      storageEntriesOf({
        settings: {
          localeStorageKey: 'app.locale',
          storage: { 'app.locale': 'de', 'app.log': '[]' },
          themeStorageKey: 'app.theme'
        },
        variant: { locale: 'fr', theme: 'dark', width: 360 }
      })
    ).toEqual({ 'app.locale': 'fr', 'app.log': '[]', 'app.theme': 'dark' })
  })

  it('[storage-entries] writes no key for a locale or theme the run does not vary', () => {
    expect(
      storageEntriesOf({
        settings: {
          localeStorageKey: 'app.locale',
          storage: {},
          themeStorageKey: 'app.theme'
        },
        variant: { locale: null, theme: null, width: 360 }
      })
    ).toEqual({})
  })
})
