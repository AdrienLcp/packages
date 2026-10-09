import { describe, expect, it } from 'vitest'

import { CATALOGUE } from '@/features/packages/catalogue-content'

import {
  PACKAGE_DESCRIPTIONS,
  packageDescriptionIn
} from './package-descriptions.ts'

const PACKAGE_NAMES = CATALOGUE.map(({ name }) => name).toSorted()

describe('PACKAGE_DESCRIPTIONS', () => {
  it.each(Object.entries(PACKAGE_DESCRIPTIONS))(
    '[package-descriptions] describes every package of the catalogue, and only those, in %s',
    (_locale, descriptions) => {
      expect(Object.keys(descriptions).toSorted()).toEqual(PACKAGE_NAMES)
    }
  )
})

describe('packageDescriptionIn', () => {
  const packageInfo = { description: 'Typed results.', name: 'result' }

  it('[package-descriptions] reads the English description from the package.json', () => {
    expect(packageDescriptionIn({ locale: 'en', packageInfo })).toBe(
      'Typed results.'
    )
  })

  it('[package-descriptions] reads another locale from its dictionary', () => {
    expect(packageDescriptionIn({ locale: 'fr', packageInfo })).toBe(
      PACKAGE_DESCRIPTIONS.fr.result
    )
  })
})
