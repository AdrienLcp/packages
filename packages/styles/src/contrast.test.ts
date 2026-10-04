import { describe, expect, it } from 'vitest'

import { findContrastFailures, WCAG_AA } from './contrast.ts'

const pair = (
  foreground: string,
  background: string,
  minimum: number = WCAG_AA.text
) => ({
  background,
  foreground,
  minimum
})

describe('findContrastFailures', () => {
  it('[contrast] passes black on white, at the top of the scale', () => {
    const tokens = `
:root
  --ink: oklch(0 0 0)
  --ground: #fff
`
    expect(
      findContrastFailures(tokens, [pair('--ink', '--ground', 21)])
    ).toEqual([])
  })

  it('[contrast] reports #777 on white just under 4.5, the classic near miss', () => {
    const tokens = ':root { --mute: #777; --ground: #ffffff; }'
    expect(findContrastFailures(tokens, [pair('--mute', '--ground')])).toEqual([
      {
        kind: 'too-low',
        pair: pair('--mute', '--ground'),
        ratio: 4.47,
        schemes: ['light', 'dark']
      }
    ])
  })

  it('[contrast] checks each side of light-dark() on its own', () => {
    const tokens = `
:root
  --ground: light-dark(oklch(1 0 0), oklch(0.2 0 0))
  --ink: light-dark(oklch(0.2 0 0), oklch(0.3 0 0))
`
    const [failure, ...rest] = findContrastFailures(tokens, [
      pair('--ink', '--ground')
    ])
    expect(rest).toEqual([])
    expect(failure).toMatchObject({ kind: 'too-low', schemes: ['dark'] })
  })

  it('[contrast] follows var() to the token it names', () => {
    const tokens = `
:root
  --ink: oklch(0.2 0 0)
  --code-foreground: var(--ink)
  --ground: oklch(0.21 0 0)
`
    expect(
      findContrastFailures(tokens, [pair('--code-foreground', '--ground')])
    ).toMatchObject([{ kind: 'too-low' }])
  })

  it('[contrast] measures a translucent foreground over its background', () => {
    const tokens = `
:root
  --ink: oklch(0 0 0 / 0.1)
  --ground: oklch(1 0 0)
`
    const [failure] = findContrastFailures(tokens, [pair('--ink', '--ground')])
    expect(failure).toMatchObject({ kind: 'too-low' })
    expect(failure?.kind === 'too-low' && failure.ratio).toBeLessThan(1.5)
  })

  it('[contrast] refuses to measure over a translucent background', () => {
    const tokens = `
:root
  --ink: oklch(0 0 0)
  --wash: oklch(0.5 0.1 200 / 0.12)
`
    expect(findContrastFailures(tokens, [pair('--ink', '--wash')])).toEqual([
      {
        error: 'translucent-background',
        kind: 'unreadable',
        pair: pair('--ink', '--wash'),
        token: '--wash'
      }
    ])
  })

  it('[contrast] reports a token it cannot pin to one value', () => {
    const tokens = `
:root
  --ground: oklch(1 0 0)
  --ink: oklch(0 0 0)
  --tinted: oklch(var(--l) 0 0)
@media (prefers-color-scheme: dark)
  :root
    --ink: oklch(0.9 0 0)
`
    expect(
      findContrastFailures(tokens, [
        pair('--ink', '--ground'),
        pair('--missing', '--ground'),
        pair('--tinted', '--ground')
      ])
    ).toMatchObject([
      { error: 'declared-twice', kind: 'unreadable', token: '--ink' },
      { error: 'undeclared', kind: 'unreadable', token: '--missing' },
      { error: 'unsupported-color', kind: 'unreadable', token: '--tinted' }
    ])
  })

  it('[contrast] ignores a declaration that only a comment mentions', () => {
    const tokens = `
:root
  // --ink: oklch(1 0 0) was too light
  --ink: oklch(0 0 0)
  /* --ground: oklch(0 0 0) */
  --ground: oklch(1 0 0)
`
    expect(findContrastFailures(tokens, [pair('--ink', '--ground')])).toEqual(
      []
    )
  })

  it('[contrast] reports a reference loop instead of following it forever', () => {
    const tokens = ':root { --a: var(--b); --b: var(--a); --ground: #fff; }'
    expect(
      findContrastFailures(tokens, [pair('--a', '--ground')])
    ).toMatchObject([{ error: 'circular-reference', kind: 'unreadable' }])
  })

  it('[contrast] reads percentages, a none hue and an eight-digit hex', () => {
    const tokens = ':root { --ink: oklch(0% 0% none); --ground: #ffffffff; }'
    expect(
      findContrastFailures(tokens, [pair('--ink', '--ground', 21)])
    ).toEqual([])
  })

  it('[contrast] takes the fallback of a var() naming no token', () => {
    const tokens = ':root { --ink: var(--absent, #000); --ground: #fff; }'
    expect(findContrastFailures(tokens, [pair('--ink', '--ground')])).toEqual(
      []
    )
  })

  it('[contrast] reports a background it cannot read', () => {
    const tokens = ':root { --ink: #000; --veil: #ffffff80; }'
    expect(
      findContrastFailures(tokens, [
        pair('--ink', '--missing'),
        pair('--ink', '--veil')
      ])
    ).toMatchObject([
      { error: 'undeclared', kind: 'unreadable', token: '--missing' },
      { error: 'translucent-background', kind: 'unreadable', token: '--veil' }
    ])
  })
})
