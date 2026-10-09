import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { measureFontCommand } from './measure-font-command.ts'
import { testFontPath } from './test-fonts.fixture.ts'

const ONEST = testFontPath('onest-latin.woff2')
const ONEST_LATIN_EXT = testFontPath('onest-latin-ext.woff2')
const JETBRAINS_MONO = testFontPath('jetbrains-mono-latin.woff2')
const BARLOW_BOLD = testFontPath('barlow-latin-700-normal.woff2')
const LIBRE_FRANKLIN = testFontPath('libre-franklin-latin-400-normal.woff2')
const ARCHIVO_BOLD = testFontPath('archivo-latin-700-wdth.woff2')
const FALLBACKS = ['--fallback', JETBRAINS_MONO, '--fallback-bold', ONEST]

const textFixture = (name: string) =>
  fileURLToPath(new URL(`test-texts/${name}`, import.meta.url))

const run = async (args: string[]) => {
  const written = { stderr: '', stdout: '' }
  const code = await measureFontCommand(args, {
    stderr: { write: (text: string) => (written.stderr += text) },
    stdout: { write: (text: string) => (written.stdout += text) }
  })
  return { code, ...written }
}

describe('measureFontCommand', () => {
  it('[measure-font] prints its usage on --help, and fails without a font', async () => {
    const help = await run(['--help'])
    expect(help.code).toBe(0)
    expect(help.stdout).toContain('Usage: measure-font <font file>...')
    expect((await run([])).code).toBe(1)
  })

  it('[measure-font] fails on a file that is missing or not a font', async () => {
    const missing = await run(['nowhere.woff2', ...FALLBACKS])
    expect(missing).toMatchObject({
      code: 1,
      stderr: 'nowhere.woff2: no such file\n'
    })
    const notAFont = await run([fileURLToPath(import.meta.url), ...FALLBACKS])
    expect(notAFont.code).toBe(1)
    expect(notAFont.stderr).toContain('not a font file')
  })

  it('[measure-font] fails on an option that is not a number or an axis setting', async () => {
    expect(await run([ONEST, ...FALLBACKS, '--weight', 'bold'])).toMatchObject({
      code: 1,
      stderr: '--weight bold: not a number\n'
    })
    expect(await run([ONEST, ...FALLBACKS, '--axis', 'wdth:70'])).toMatchObject(
      { code: 1, stderr: '--axis wdth:70: write it <tag>=<n>, wdth=70\n' }
    )
  })

  it('[measure-font] measures a variable file at each weight and writes the include', async () => {
    const { code, stderr, stdout } = await run([
      ONEST,
      ...FALLBACKS,
      '--weight',
      '400',
      '--weight',
      '700',
      '--size-adjust',
      '1.05',
      '--family',
      'Onest Variable',
      '--text',
      'Hamburgefonstiv',
      '--italic'
    ])
    expect(code).toBe(0)
    expect(stderr).toBe('')
    expect(stdout).toContain('onest-latin.woff2 at 400: zero 0.665em')
    expect(stdout).toContain('over Onest Regular')
    expect(stdout).toContain('size-adjust 1.05, as given')
    expect(stdout).toMatch(
      /@include fonts\.fallback-faces\('Onest Variable', .*, 1\.05, \(400: [\d.]+, 700: [\d.]+\), \$style: italic\)\n$/
    )
  })

  it('[measure-font] warns that the default pangram is not the app’s text', async () => {
    const { code, stderr } = await run([ONEST, ...FALLBACKS])
    expect(code).toBe(0)
    expect(stderr).toContain('warning: width ratios over the default pangram')
  })

  it('[measure-font] refuses a text of spaces alone', async () => {
    expect(await run([ONEST, ...FALLBACKS, '--text', ' \n '])).toMatchObject({
      code: 1,
      stderr: 'No text to measure: the text is empty.\n'
    })
  })

  it('[measure-font] measures the digits with their features for a figures face', async () => {
    const { code, stdout } = await run([
      BARLOW_BOLD,
      ...FALLBACKS,
      '--text',
      'Score',
      '--figures',
      '--figure-feature',
      'tnum'
    ])
    expect(code).toBe(0)
    expect(stdout).toMatch(/figures ratio [\d.]+ over/)
    expect(stdout).toMatch(/, \$figures: [\d.]+\)\n$/)
  })

  it('[measure-font] refuses a figure feature the file lacks', async () => {
    const { code, stderr } = await run([
      LIBRE_FRANKLIN,
      ...FALLBACKS,
      '--figures',
      '--figure-feature',
      'tnum'
    ])
    expect(code).toBe(1)
    expect(stderr).toBe(
      'libre-franklin-latin-400-normal.woff2: no tnum feature. A browser sets its digits without it, so the measure would describe figures the page never shows: serve a file that has it, or drop --figure-feature tnum.\n'
    )
  })

  it('[measure-font] prints the $figures argument alone for --figures-only, with the separators', async () => {
    const { code, stderr, stdout } = await run([
      ONEST,
      ...FALLBACKS,
      '--weight',
      '400',
      '--weight',
      '500',
      '--figures-only',
      '--figure-separators'
    ])
    expect(code).toBe(0)
    expect(stderr).toBe('')
    expect(stdout).not.toContain('width ratio')
    expect(stdout).toMatch(
      /\n\$figures: \(400: [\d.]+, 500: [\d.]+\), \$figure-separators: true\n$/
    )
  })

  it('[measure-font] measures the unicode-range subsets of a face as one font', async () => {
    const { code, stdout } = await run([
      ONEST,
      ONEST_LATIN_EXT,
      ...FALLBACKS,
      '--text',
      'Łódź and Kraków'
    ])
    expect(code).toBe(0)
    expect(stdout).toContain(
      'onest-latin.woff2 + onest-latin-ext.woff2 at 400: zero'
    )
    expect(stdout).toMatch(/\(400: [\d.]+\)\)\n$/)
  })

  it('[measure-font] refuses a subset that draws none of the text', async () => {
    const { code, stderr } = await run([
      ONEST_LATIN_EXT,
      ...FALLBACKS,
      '--text',
      'Hello'
    ])
    expect(code).toBe(1)
    expect(stderr).toMatch(
      /^onest-latin-ext\.woff2: no glyph for any character of the text\./
    )
  })

  it('[measure-font] reads a width axis and writes it as $stretch', async () => {
    const { code, stdout } = await run([
      ARCHIVO_BOLD,
      ...FALLBACKS,
      '--axis',
      'wdth=70',
      '--text',
      'COLOR DOTS',
      '--size-adjust',
      '1'
    ])
    expect(code).toBe(0)
    expect(stdout).toMatch(
      /@include fonts\.fallback-faces\('Archivo[^']*', \(.*\), \$widths: \(700: [\d.]+\), \$stretch: 70%\)\n$/
    )
    expect((await run([ONEST, ...FALLBACKS, '--axis', 'wdth=70'])).stderr).toBe(
      'onest-latin.woff2: no wdth axis to read at --axis wdth.\n'
    )
  })

  it('[measure-font] reads the text from a dictionary and a prerendered dist, uppercased', async () => {
    const { code, stdout } = await run([
      ONEST,
      ...FALLBACKS,
      '--text-from',
      textFixture('en.json'),
      '--text-from-dist',
      textFixture('pages'),
      '--select',
      'h1',
      '--uppercase'
    ])
    expect(code).toBe(0)
    expect(stdout).toMatch(/width ratio [\d.]+ over/)
    expect(
      (await run([ONEST, ...FALLBACKS, '--text-from', 'nowhere.json'])).stderr
    ).toBe('nowhere.json: no such file\n')
  })

  it('[measure-font] bounds the ratio by the edge lines of a --lines file', async () => {
    const { code, stdout } = await run([
      ONEST,
      ...FALLBACKS,
      '--text',
      'Print the family sheet',
      '--lines',
      textFixture('lines.json')
    ])
    expect(code).toBe(0)
    expect(stdout).toMatch(
      /keeps its 2 lines wrapped as the web font wraps them/
    )
    const malformed = await run([
      ONEST,
      ...FALLBACKS,
      '--lines',
      textFixture('en.json')
    ])
    expect(malformed.stderr).toContain(
      'not a JSON array of { text, box, fontSize, weight?, letterSpacing? }'
    )
  })

  it('[measure-font] takes ascent and descent by hand', async () => {
    const { stdout } = await run([
      ONEST,
      ...FALLBACKS,
      '--text',
      'Hello',
      '--ascent',
      '0.9',
      '--descent',
      '0.25'
    ])
    expect(stdout).toContain('ascent 0.9, as given')
    expect(stdout).toContain('(ascent: 0.9, descent: 0.25, cap-height: 0.707)')
  })

  it('[measure-font] measures each static file at its own weight, over the bold cut from --bold-from', async () => {
    const { code, stdout } = await run([
      BARLOW_BOLD,
      ...FALLBACKS,
      '--bold-from',
      '600',
      '--text-file',
      fileURLToPath(new URL('font-metrics.ts', import.meta.url))
    ])
    expect(code).toBe(0)
    expect(stdout).toContain(
      'barlow-latin-700-normal.woff2 at 700: zero 0.57em'
    )
    expect(stdout).toContain('over Onest Regular')
    expect(stdout).toMatch(
      /size-adjust [\d.]+, fontaine's, computed from the first file/
    )
    expect(stdout).toContain("@include fonts.fallback-faces('Barlow'")
  })
})
