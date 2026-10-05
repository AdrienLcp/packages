import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { mergeSettings, parsePartialSettings } from './parse-settings.ts'

const BASE_FOLDER = resolve('/projects/app')

const fromConfig = (raw: Record<string, unknown>) =>
  parsePartialSettings({ baseFolder: BASE_FOLDER, raw, source: 'config' })

describe('parsePartialSettings', () => {
  it('[settings] keeps what a config file gives and leaves the rest unset', () => {
    expect(
      fromConfig({
        locales: ['en', 'fr-FR'],
        paths: ['/', '/settings?tab=sound'],
        themes: ['dark'],
        widths: [320, 360]
      })
    ).toEqual({
      data: {
        locales: ['en', 'fr-FR'],
        paths: ['/', '/settings?tab=sound'],
        themes: ['dark'],
        widths: [320, 360]
      },
      status: 'success'
    })
  })

  it('[settings] keeps the origin alone, dropping any path or trailing slash', () => {
    expect(fromConfig({ origin: 'http://localhost:5186/app/' })).toEqual({
      data: { origin: 'http://localhost:5186' },
      status: 'success'
    })
  })

  it('[settings] resolves file paths from the base folder', () => {
    expect(fromConfig({ mocks: 'fixtures/mocks.json', out: 'shots' })).toEqual({
      data: {
        mocks: resolve(BASE_FOLDER, 'fixtures/mocks.json'),
        out: resolve(BASE_FOLDER, 'shots')
      },
      status: 'success'
    })
  })

  it('[settings] reads the pinned time as epoch milliseconds', () => {
    expect(fromConfig({ time: '2026-10-03T12:00:00Z' })).toEqual({
      data: {
        time: Temporal.Instant.from('2026-10-03T12:00:00Z').epochMilliseconds
      },
      status: 'success'
    })
  })

  it('[settings] writes a storage fixture that is not text as JSON', () => {
    expect(
      fromConfig({
        storage: { 'app.log': { entries: [] }, 'app.theme': 'dark' }
      })
    ).toEqual({
      data: { storage: { 'app.log': '{"entries":[]}', 'app.theme': 'dark' } },
      status: 'success'
    })
  })

  it.each([
    ['origin', 'ftp://localhost'],
    ['origin', 'localhost:5173'],
    ['paths', ['settings']],
    ['paths', []],
    ['widths', [320, 0]],
    ['widths', [320.5]],
    ['widths', [Number.NaN]],
    ['height', 20_000],
    ['locales', ['not a tag']],
    ['themes', ['sepia']],
    ['time', '2026-10-03T12:00:00'],
    ['timezone', 'Mars/Olympus'],
    ['settleMs', -1],
    ['fullPage', 'yes'],
    ['storage', null],
    ['volumeKeys', ['app.volume', '']]
  ])('[settings] refuses %s = %j, naming the setting', (setting, value) => {
    expect(fromConfig({ [setting]: value })).toEqual({
      error: { code: 'invalid_setting', setting, source: 'config' },
      status: 'failure'
    })
  })

  it('[settings] refuses a name no setting has, so a typo never passes silently', () => {
    expect(
      parsePartialSettings({
        baseFolder: BASE_FOLDER,
        raw: { viewport: [320] },
        source: 'arguments'
      })
    ).toEqual({
      error: {
        code: 'unknown_setting',
        setting: 'viewport',
        source: 'arguments'
      },
      status: 'failure'
    })
  })
})

describe('mergeSettings', () => {
  it('[settings] lays the flags over the config file over the defaults', () => {
    const merged = mergeSettings({
      fromArguments: { widths: [320] },
      fromConfig: { origin: 'http://localhost:5186', widths: [360, 1440] },
      workingFolder: BASE_FOLDER
    })

    expect(merged.status === 'success' && merged.data).toMatchObject({
      height: 800,
      origin: 'http://localhost:5186',
      out: resolve(BASE_FOLDER, 'shots'),
      paths: ['/'],
      widths: [320]
    })
  })

  it('[settings] fails when nothing gives an origin', () => {
    expect(
      mergeSettings({
        fromArguments: {},
        fromConfig: { widths: [320] },
        workingFolder: BASE_FOLDER
      })
    ).toEqual({ error: { code: 'missing_origin' }, status: 'failure' })
  })
})
