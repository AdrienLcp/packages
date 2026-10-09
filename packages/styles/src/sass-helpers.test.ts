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

describe('arriving', () => {
  it('[arriving] plays on the first landing only, and only where motion is welcome', () => {
    const css = compile(`
@use 'motion'
.page
  @include motion.arriving
`)

    expect(css).toBe(
      '@media(prefers-reduced-motion: no-preference){:root[data-landing] .page{animation:arriving var(--transition-base, 0s) var(--ease-out, ease) 0s both}}'
    )
  })

  it('[arriving] plays wherever the element appears once the landing mark is false', () => {
    const css = compile(`
@use 'motion' with ($landing: false)
.page
  @include motion.arriving($delay: 50ms)
`)

    expect(css).toContain(
      '.page{animation:arriving var(--transition-base, 0s) var(--ease-out, ease) 50ms both}'
    )
    expect(css).not.toContain('data-landing')
  })

  it('[arriving] rises and fades in on translate, leaving transform to the element', () => {
    const css = compile(`
@use 'motion'
@include motion.keyframes
`)

    expect(css).toBe('@keyframes arriving{from{opacity:0;translate:0 .5rem}}')
  })
})
