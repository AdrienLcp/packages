import { readFileSync } from 'node:fs'

import {
  type ContrastPair,
  findContrastFailures,
  WCAG_AA
} from '@adrienlcp/styles/contrast'
import { expect, it } from 'vitest'

const TOKENS = readFileSync(new URL('_tokens.sass', import.meta.url), 'utf8')

const SURFACES = [
  '--sunk',
  '--ground',
  '--plane',
  '--ply',
  '--hover',
  '--press'
]
const TEXT_INKS = ['--ink', '--ink-soft', '--mute', '--accent']

const PAIRS: ContrastPair[] = SURFACES.flatMap((background) => [
  ...TEXT_INKS.map((foreground) => ({
    background,
    foreground,
    minimum: WCAG_AA.text
  })),
  { background, foreground: '--focus', minimum: WCAG_AA.nonText }
])

it('[contrast] every ink reads on every surface, in both themes', () => {
  expect(findContrastFailures(TOKENS, PAIRS)).toEqual([])
})
