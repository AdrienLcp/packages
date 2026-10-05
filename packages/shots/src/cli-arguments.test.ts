import { describe, expect, it } from 'vitest'

import { parseCliArguments } from './cli-arguments.ts'

const settingsOf = (argv: readonly string[]) => {
  const parsed = parseCliArguments(argv)
  if (parsed.status === 'failure') throw new Error(parsed.error.code)
  return parsed.data.settings
}

describe('parseCliArguments', () => {
  it('[cli-arguments] splits list flags on commas and across repeats', () => {
    expect(
      settingsOf([
        '--widths',
        '320,360',
        '--widths=1440',
        '--locales',
        'en, fr'
      ])
    ).toEqual({ locales: ['en', 'fr'], widths: [320, 360, 1440] })
  })

  it('[cli-arguments] takes bare words as paths, before the flagged ones', () => {
    expect(settingsOf(['/', '--paths', '/about', '/settings'])).toEqual({
      paths: ['/', '/settings', '/about']
    })
  })

  it('[cli-arguments] maps kebab-case flags onto their settings', () => {
    expect(
      settingsOf([
        '--locale-storage-key',
        'app.locale',
        '--volume-key',
        'app.volume',
        '--settle',
        '250',
        '--viewport-only'
      ])
    ).toEqual({
      fullPage: false,
      localeStorageKey: 'app.locale',
      settleMs: 250,
      volumeKeys: ['app.volume']
    })
  })

  it('[cli-arguments] keeps the last value of a single-valued flag', () => {
    expect(
      settingsOf(['--origin', 'http://a.test', '--origin', 'http://b.test'])
    ).toEqual({
      origin: 'http://b.test'
    })
  })

  it('[cli-arguments] reads storage entries, splitting on the first equals sign', () => {
    expect(
      settingsOf(['--storage', 'app.theme=dark', '--storage', 'q=a=b'])
    ).toEqual({
      storage: { 'app.theme': 'dark', q: 'a=b' }
    })
  })

  it('[cli-arguments] hands an entry without a key on, for the storage reader to refuse', () => {
    expect(settingsOf(['--storage', '=dark'])).toEqual({ storage: null })
  })

  it('[cli-arguments] leaves a non-numeric width as NaN, for the widths reader to refuse', () => {
    expect(settingsOf(['--widths', '320,wide'])).toEqual({
      widths: [320, Number.NaN]
    })
  })

  it('[cli-arguments] reads the config file and the help switch apart from the settings', () => {
    expect(parseCliArguments(['--config', 'shots.json', '-h'])).toEqual({
      data: { configFile: 'shots.json', help: true, settings: {} },
      status: 'success'
    })
  })

  it('[cli-arguments] refuses an option nobody knows', () => {
    expect(parseCliArguments(['--viewport', '320'])).toEqual({
      error: { code: 'unknown_option', option: 'viewport' },
      status: 'failure'
    })
  })

  it('[cli-arguments] refuses a flag left without its value', () => {
    expect(parseCliArguments(['--origin'])).toEqual({
      error: { code: 'missing_value', option: 'origin' },
      status: 'failure'
    })
  })
})
