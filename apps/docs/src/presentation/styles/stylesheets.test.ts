import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { REACT_ARIA_TOKENS } from '@adrienlcp/react-aria'
import {
  findFallbackBandFailures,
  findFallbackFailures,
  findFontAttributeFailures,
  findTokenFailures,
  findTypeLiterals,
  findUnitFailures,
  findUnnamedValues,
  findUnreadFontFaces,
  webFontFamilies
} from '@adrienlcp/styles/audit'
import { describe, expect, it } from 'vitest'

const SOURCE_DIRECTORY = fileURLToPath(new URL('../..', import.meta.url))

const findSourceFiles = (pattern: string) =>
  globSync(pattern, { cwd: SOURCE_DIRECTORY })

const readSourceFile = (path: string) =>
  readFileSync(join(SOURCE_DIRECTORY, path), 'utf8')

const STYLESHEETS = findSourceFiles('**/*.{sass,css}')
const MARKUP = findSourceFiles('**/*.{tsx,svg}')
const STYLESHEET_SOURCES = STYLESHEETS.map(readSourceFile)
const SOURCES = findSourceFiles('**/*.{sass,css,ts,tsx}').map(readSourceFile)
const WEB_FONTS = webFontFamilies(STYLESHEET_SOURCES)

it('[audit] finds the stylesheets it audits', () => {
  expect(STYLESHEETS).not.toEqual([])
})

describe.each(STYLESHEETS)('%s', (path) => {
  const stylesheet = readSourceFile(path)

  it('[units] sizes text, spacing and boxes in rem', () => {
    expect(findUnitFailures(stylesheet)).toEqual([])
  })

  it.skipIf(path.endsWith('_typography.sass'))(
    '[voice] takes its text voice from the typography mixins',
    () => {
      expect(findTypeLiterals(stylesheet)).toEqual([])
    }
  )

  it('[names] takes its radii, durations, text sizes and insets from tokens', () => {
    expect(findUnnamedValues(stylesheet)).toEqual([])
  })

  it('[fonts] writes every face so the audit reads its family', () => {
    expect(findUnreadFontFaces(stylesheet)).toEqual([])
  })

  it('[fonts] names the fallback face after every web font in a font token', () => {
    expect(findFallbackFailures(stylesheet, WEB_FONTS)).toEqual([])
  })
})

describe.each(MARKUP)('%s', (path) => {
  it('[fonts] sets text in a font token, never a family by name', () => {
    expect(findFontAttributeFailures(readSourceFile(path))).toEqual([])
  })
})

it('[fonts] draws a fallback face for every weight and style it sets, and none it does not', () => {
  expect(findFallbackBandFailures(STYLESHEET_SOURCES)).toEqual([])
})

it('[tokens] reads only custom properties that exist, under their one shared name', () => {
  expect(findTokenFailures(SOURCES, { provided: REACT_ARIA_TOKENS })).toEqual(
    []
  )
})
