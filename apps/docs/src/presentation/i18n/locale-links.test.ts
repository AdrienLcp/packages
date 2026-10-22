import { describe, expect, it } from 'vitest'

import { localeLinksFor } from './locale-links.ts'

describe('localeLinksFor', () => {
  it('[locale-links] gives the same page in every language', () => {
    expect(localeLinksFor('/en/packages/result')).toEqual([
      { href: '/en/packages/result', locale: 'en', name: 'English' },
      { href: '/fr/packages/result', locale: 'fr', name: 'Français' }
    ])
  })

  it('[locale-links] gives nothing for a path that names no language', () => {
    expect(localeLinksFor('/packages/result')).toEqual([])
  })
})
