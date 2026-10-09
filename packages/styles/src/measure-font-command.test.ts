import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { measureFontCommand } from './measure-font-command.ts'

const fixture = (name: string) =>
  fileURLToPath(new URL(`test-fonts/${name}`, import.meta.url))

const ONEST = fixture('onest-latin.woff2')
const JETBRAINS_MONO = fixture('jetbrains-mono-latin.woff2')
const BARLOW_BOLD = fixture('barlow-latin-700-normal.woff2')
const FALLBACKS = ['--fallback', JETBRAINS_MONO, '--fallback-bold', ONEST]

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

  it('[measure-font] measures a variable file at each weight and writes the include', async () => {
    const { code, stdout } = await run([
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
    expect(stdout).toContain('onest-latin.woff2 at 400: zero 0.665em')
    expect(stdout).toContain('over Onest Regular')
    expect(stdout).toContain('size-adjust 1.05, as given')
    expect(stdout).toMatch(
      /@include fonts\.fallback-faces\('Onest Variable', .*, 1\.05, \(400: [\d.]+, 700: [\d.]+\), \$style: italic\)\n$/
    )
  })

  it('[measure-font] measures each static file at its own weight, over the bold cut from --bold-from', async () => {
    const { code, stdout } = await run([
      BARLOW_BOLD,
      ...FALLBACKS,
      '--bold-from',
      '600',
      '--text-file',
      fixture('../font-metrics.ts')
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
