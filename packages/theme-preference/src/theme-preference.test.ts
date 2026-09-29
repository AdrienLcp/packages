import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyThemePreference } from './apply-theme-preference.ts'
import { prePaintScriptFor } from './pre-paint-script.ts'
import type { ThemePreference } from './theme-preference.ts'
import { readStoredThemePreference } from './theme-preference-storage.ts'
import { createThemePreferenceStore } from './theme-preference-store.ts'

const STORAGE_KEY = 'test:theme'

const THEME_COLOR_TAGS = [
  '<meta name="theme-color" data-scheme="light" content="#fff" media="(prefers-color-scheme: light)">',
  '<meta name="theme-color" data-scheme="dark" content="#000" media="(prefers-color-scheme: dark)">'
].join('')

const renderThemeColorTags = (): void => {
  document.head.innerHTML = THEME_COLOR_TAGS
  delete document.documentElement.dataset.theme
}

/** What the browser chrome and the stylesheet read. */
const paintedState = (): {
  dataTheme: string | undefined
  media: (string | null)[]
} => ({
  dataTheme: document.documentElement.dataset.theme,
  media: [
    ...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
  ].map((meta) => meta.getAttribute('media'))
})

const runPrePaintScript = (): void => {
  new Function(prePaintScriptFor(STORAGE_KEY))()
}

beforeEach(() => {
  localStorage.clear()
  renderThemeColorTags()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pre-paint script', () => {
  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    [null, 'system'],
    ['sepia', 'system']
  ] satisfies [string | null, ThemePreference][])(
    '[pre-paint] a stored %s paints what applyThemePreference(%s) paints',
    (stored, preference) => {
      if (stored !== null) {
        localStorage.setItem(STORAGE_KEY, stored)
      }

      runPrePaintScript()
      const fromScript = paintedState()

      renderThemeColorTags()
      applyThemePreference(preference)

      expect(fromScript).toEqual(paintedState())
    }
  )

  it('[pre-paint] survives a storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(runPrePaintScript).not.toThrow()
    expect(paintedState().dataTheme).toBeUndefined()
  })
})

describe('applyThemePreference', () => {
  it('[apply] pins the chosen scheme and switches the other tag off', () => {
    applyThemePreference('dark')

    expect(paintedState()).toEqual({
      dataTheme: 'dark',
      media: ['not all', 'all']
    })
  })

  it('[apply] system hands the attribute and both tags back to the media query', () => {
    applyThemePreference('light')
    applyThemePreference('system')

    expect(paintedState()).toEqual({
      dataTheme: undefined,
      media: ['(prefers-color-scheme: light)', '(prefers-color-scheme: dark)']
    })
  })
})

describe('storage', () => {
  it('[storage] system is stored as no entry, so the pre-paint script leaves the page alone', () => {
    const store = createThemePreferenceStore({ storageKey: STORAGE_KEY })

    store.setPreference('dark')
    store.setPreference('system')

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('[storage] a storage that throws reads as system', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(readStoredThemePreference(STORAGE_KEY)).toBe('system')
  })
})

describe('store', () => {
  it('[store] reads the stored preference', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    expect(
      createThemePreferenceStore({ storageKey: STORAGE_KEY }).getPreference()
    ).toBe('dark')
  })

  it('[store] a choice reaches every subscriber, the document and a fresh page load', () => {
    const store = createThemePreferenceStore({ storageKey: STORAGE_KEY })
    const listener = vi.fn()
    store.subscribe(listener)

    store.setPreference('light')

    expect(listener).toHaveBeenCalledOnce()
    expect(store.getPreference()).toBe('light')
    expect(paintedState().dataTheme).toBe('light')
    expect(
      createThemePreferenceStore({ storageKey: STORAGE_KEY }).getPreference()
    ).toBe('light')
  })

  it('[store] an unsubscribed listener hears nothing', () => {
    const store = createThemePreferenceStore({ storageKey: STORAGE_KEY })
    const listener = vi.fn()
    store.subscribe(listener)()

    store.setPreference('dark')

    expect(listener).not.toHaveBeenCalled()
  })

  it('[store] creating a store touches no storage', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')

    createThemePreferenceStore({ storageKey: STORAGE_KEY })

    expect(getItem).not.toHaveBeenCalled()
  })
})
