import { describe, expect, it } from 'vitest'

import { describeSettingsError } from './describe-settings-error.ts'
import { summarize } from './summary.ts'
import type { ShotReport } from './take-shots.ts'

const VARIANT = { locale: null, theme: null, width: 320 }

const fits: ShotReport = {
  fileName: 'home.320.png',
  outcome: { overflow: { status: 'fits' }, status: 'taken' },
  path: '/',
  variant: VARIANT
}

const overflows: ShotReport = {
  fileName: 'settings.320.png',
  outcome: {
    overflow: {
      culprits: [
        { excess: 24, label: 'table.log' },
        { excess: 8, label: 'pre' }
      ],
      excess: 24,
      status: 'overflows'
    },
    status: 'taken'
  },
  path: '/settings',
  variant: VARIANT
}

const missing: ShotReport = {
  fileName: 'nope.320.png',
  outcome: { reason: 'unreachable', status: 'failed' },
  path: '/nope',
  variant: VARIANT
}

describe('summarize', () => {
  it('[summary] prints the counts alone when every shot fits', () => {
    expect(summarize({ out: 'shots', reports: [fits] })).toEqual({
      exitCode: 0,
      text: '1 shot in shots — 0 overflowing, 0 failed'
    })
  })

  it('[summary] flags an overflowing page with its culprits, and still exits 0', () => {
    expect(summarize({ out: 'shots', reports: [fits, overflows] })).toEqual({
      exitCode: 0,
      text: [
        '2 shots in shots — 1 overflowing, 0 failed',
        '  overflow  settings.320.png  24px wider than the viewport: table.log (+24px), pre (+8px)'
      ].join('\n')
    })
  })

  it('[summary] says so when no single element explains the overflow', () => {
    const unexplained: ShotReport = {
      ...overflows,
      outcome: {
        overflow: { culprits: [], excess: 3, status: 'overflows' },
        status: 'taken'
      }
    }

    expect(summarize({ out: 'shots', reports: [unexplained] }).text).toContain(
      '3px wider than the viewport: no single element found'
    )
  })

  it('[summary] lists a missing shot and exits 1', () => {
    expect(summarize({ out: 'shots', reports: [fits, missing] })).toEqual({
      exitCode: 1,
      text: [
        '1 shot in shots — 0 overflowing, 1 failed',
        '  failed    nope.320.png  page did not load'
      ].join('\n')
    })
  })
})

describe('describeSettingsError', () => {
  it.each([
    [
      { code: 'invalid_setting', setting: 'widths', source: 'arguments' },
      '"widths" from the command line expects whole numbers of pixels, 1 to 10000.'
    ],
    [
      { code: 'unknown_setting', setting: 'viewport', source: 'config' },
      '"viewport" from the config file is not a setting.'
    ],
    [
      { code: 'invalid_mock', index: 0, path: 'mocks.json' },
      'Mock #1 in mocks.json is not a mock: it needs a url and one of json, body, abort or hang.'
    ],
    [
      { code: 'missing_origin' },
      'No origin: pass --origin http://localhost:5173 or set "origin" in shots.config.json.'
    ],
    [{ code: 'missing_value', option: 'origin' }, '--origin needs a value.'],
    [
      { code: 'unknown_option', option: 'viewport' },
      '--viewport is not an option. Run shots --help.'
    ],
    [
      { code: 'malformed_file', path: 'shots.config.json' },
      'shots.config.json does not hold what it should: JSON, or a module with a default export.'
    ],
    [
      { code: 'unreadable_file', path: 'mocks.json' },
      'mocks.json could not be read.'
    ]
  ] as const)('[summary] words %j', (error, message) => {
    expect(describeSettingsError(error)).toBe(message)
  })
})
