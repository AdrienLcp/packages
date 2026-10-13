import { fileURLToPath } from 'node:url'

import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

const SOURCE_DIRECTORY = fileURLToPath(new URL('.', import.meta.url))

const compile = (source: string) =>
  compileString(source, {
    loadPaths: [SOURCE_DIRECTORY],
    style: 'compressed',
    syntax: 'indented'
  }).css

describe('skip link', () => {
  const css = compile(`
@use 'accessibility'
.skip-link
  @include accessibility.skip-link
`)

  it('[skip-link] shows below the notch and parks past it by the same offset', () => {
    expect(css).toContain(
      'top:max(var(--space-2xs, 0.25rem),var(--safe-area-top, 0px))'
    )
    expect(css).toContain(
      'translate:0 calc(-100% - var(--space-2xs, 0.25rem) - var(--safe-area-top, 0px) - 0.75rem)'
    )
    expect(css).toContain('.skip-link:focus-visible{translate:0}')
  })

  it('[skip-link] hides while a view transition pictures the page', () => {
    expect(css).toContain(
      ':root:active-view-transition .skip-link{visibility:hidden}'
    )
  })

  it('[skip-link] takes another top and left', () => {
    const moved = compile(`
@use 'accessibility'
.skip-link
  @include accessibility.skip-link($top: 1rem, $left: 2rem)
`)

    expect(moved).toContain('left:2rem')
    expect(moved).toContain('top:max(1rem,var(--safe-area-top, 0px))')
  })
})

describe('spin', () => {
  const css = compile(`
@use 'motion'
@layer components
  .spinner
    @include motion.spin(1s)
  @media (width > 40rem)
    .sync
      @include motion.spin(calc(var(--transition-slow) * 2))
`)

  it('[spin] turns the element a full circle at a constant speed, forever', () => {
    expect(css).toContain('.spinner{animation:motion-spin 1s linear infinite}')
    expect(css).toContain(
      '.sync{animation:motion-spin calc(var(--transition-slow)*2) linear infinite}'
    )
    expect(css).toContain('@keyframes motion-spin{to{rotate:360deg}}')
  })

  it('[spin] writes the keyframes once, at the root, outside the rule that includes it first', () => {
    expect(css.match(/@keyframes/g)).toHaveLength(1)
    expect(css.startsWith('@layer components{.spinner')).toBe(true)
    expect(css).toMatch(/\}@keyframes motion-spin/)
  })
})
