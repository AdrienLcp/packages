import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

import manifest from '../package.json' with { type: 'json' }

const SOURCE_DIRECTORY = fileURLToPath(new URL('.', import.meta.url))

const compile = (source: string) =>
  compileString(source, {
    loadPaths: [SOURCE_DIRECTORY],
    style: 'compressed',
    syntax: 'indented'
  }).css

const exportTargets = Object.values(manifest.exports).map((target) =>
  typeof target === 'string' ? target : target.sass
)

describe('the package manifest', () => {
  it.each(exportTargets)(
    '[manifest] points %s at a file that ships',
    (target) => {
      expect(existsSync(new URL(`../${target}`, import.meta.url))).toBe(true)
    }
  )
})

describe('reset', () => {
  it('[reset] lets every size transition reach an intrinsic keyword', () => {
    const reset = readFileSync(new URL('reset.css', import.meta.url), 'utf8')
    expect(reset).toMatch(/html \{[^}]*interpolate-size: allow-keywords;/)
  })

  it('[reset] stops a scrolled-to anchor below a sticky header the app measures', () => {
    const reset = readFileSync(new URL('reset.css', import.meta.url), 'utf8')
    expect(reset).toMatch(
      /html \{[^}]*scroll-padding-block-start: var\(--scroll-offset, 0px\);/
    )
  })

  it('[reset] keeps every stacking context of the app under the overlays portalled to body', () => {
    const reset = readFileSync(new URL('reset.css', import.meta.url), 'utf8')
    expect(reset).toMatch(/#root \{\s*isolation: isolate;/)
  })

  it('[reset] keeps hidden elements hidden whatever display a component gives them, unlayered', () => {
    const reset = readFileSync(new URL('reset.css', import.meta.url), 'utf8')
    const unlayered = reset.slice(reset.indexOf('\n}\n') + 3)
    expect(unlayered).toMatch(
      /^\s*\/\*[^*]*\*\/\s*\[hidden\]:not\(\[hidden="until-found"\]\) \{\s*display: none !important;/
    )
  })
})

describe('reduced motion', () => {
  it('[motion] ends every keyframe animation at once, looping ones included', () => {
    const css = readFileSync(
      new URL('reduced-motion.css', import.meta.url),
      'utf8'
    )
    expect(css).toMatch(
      /\*,\s*::before,\s*::after \{\s*animation-duration: 0s;\s*animation-iteration-count: 1;/
    )
  })

  it('[motion] stills every view transition, which no duration token reaches', () => {
    const css = readFileSync(
      new URL('reduced-motion.css', import.meta.url),
      'utf8'
    )
    expect(css).toMatch(
      /::view-transition-group\(\*\),\s*::view-transition-image-pair\(\*\),\s*::view-transition-old\(\*\),\s*::view-transition-new\(\*\) \{\s*animation: none;/
    )
  })
})

describe('breakpoints', () => {
  it('[breakpoints] splits every width into wide or narrow at 56.25rem', () => {
    const css = compile(`
@use 'breakpoints'
.a
  @include breakpoints.wide
    color: red
  @include breakpoints.narrow
    color: blue
`)
    expect(css).toContain('@media(width >= 56.25rem){.a{color:red}}')
    expect(css).toContain('@media(width < 56.25rem){.a{color:blue}}')
  })

  it('[breakpoints] takes another breakpoint through configuration', () => {
    const css = compile(`
@use 'breakpoints' with ($wide-screen: 64rem)
.a
  @include breakpoints.wide
    color: red
`)
    expect(css).toContain('width >= 64rem')
  })
})

describe('containers', () => {
  it('[containers] declares an inline-size container, named only when given a name', () => {
    const css = compile(`
@use 'containers'
.anonymous
  @include containers.container
.named
  @include containers.container(card)
`)
    expect(css).toContain('.anonymous{container-type:inline-size}')
    expect(css).toContain(
      '.named{container-type:inline-size;container-name:card}'
    )
  })

  it('[containers] splits every container width into wide or narrow at the given width', () => {
    const css = compile(`
@use 'containers'
.a
  @include containers.container-wide(30rem)
    color: red
  @include containers.container-narrow(30rem)
    color: blue
`)
    expect(css).toContain('@container (width >= 30rem){.a{color:red}}')
    expect(css).toContain('@container (width < 30rem){.a{color:blue}}')
  })

  it('[containers] queries a named container', () => {
    const css = compile(`
@use 'containers'
.a
  @include containers.container-wide(30rem, card)
    color: red
`)
    expect(css).toContain('@container card (width >= 30rem){.a{color:red}}')
  })
})

describe('fonts', () => {
  it('[fonts] declares a face and leaves out an axis it was not given', () => {
    const css = compile(`
@use 'fonts'
@include fonts.font-face('Archivo', '/fonts/archivo-latin.woff2', fonts.$latin, $weight: 600 900)
`)
    expect(css).toContain('font-family:"Archivo"')
    expect(css).toContain('font-weight:600 900')
    expect(css).toContain('unicode-range:U+0000-00FF')
    expect(css).not.toContain('font-stretch')
  })
})

describe('tokens', () => {
  const compileTokens = (overrides = '') =>
    compile(`
@use 'tokens'
:root
  @include tokens.defaults
${overrides}
`)

  it('[tokens] declares every shared name at a default value', () => {
    const css = compileTokens()

    expect(css).toContain('--stroke-hair: 1px')
    expect(css).toContain('--hairline: var(--stroke-hair) solid var(--rule,')
    expect(css).toContain('--inset-hairline: inset 0 0 0 var(--stroke-hair)')
    expect(css).toContain(
      '--ring: var(--outline-thick) solid var(--focus, currentColor)'
    )
    expect(css).toContain('--ring-inset: calc(-1 * var(--outline-thick))')
    expect(css).toContain('--target: 44px')
    expect(css).toContain('--control-height: max(var(--target), 2.75rem)')
    expect(css).toContain('--measure: 65ch')
    expect(css).toContain('--icon-m: 1.25rem')
    expect(css).toContain('--tracking-tight: -0.02em')
    expect(css).toContain('--underline-offset: 0.24em')
    expect(css).toContain('--transition-base: 250ms')
    expect(css).toContain('--ease-out: cubic-bezier(0.16, 1, 0.3, 1)')
  })

  it('[tokens] lets a value the app declares after them win', () => {
    const css = compileTokens('  --measure: 62ch')

    expect(css.lastIndexOf('--measure: 62ch')).toBeGreaterThan(
      css.indexOf('--measure: 65ch')
    )
  })
})

describe('accessibility', () => {
  it('[a11y] hides from sight without hiding from a screen reader', () => {
    const css = compile(`
@use 'accessibility'
.label
  @include accessibility.visually-hidden
`)

    expect(css).toContain('clip-path:inset(50%)')
    expect(css).toContain('position:absolute')
    expect(css).not.toContain('display:none')
    expect(css).not.toContain('visibility:hidden')
  })

  it('[a11y] rings on keyboard focus only, native or marked by react-aria', () => {
    const css = compile(`
@use 'accessibility'
.button
  @include accessibility.ring
`)

    expect(css).toBe(
      '.button[data-focus-visible],.button:focus-visible{outline:var(--ring);outline-offset:var(--ring-offset)}'
    )
  })

  it('[a11y] draws the inset ring inside the box', () => {
    const css = compile(`
@use 'accessibility'
.row
  @include accessibility.ring-inset
`)

    expect(css).toContain('outline-offset:var(--ring-inset)')
  })

  it('[a11y] rings a descendant of the focused element', () => {
    const css = compile(`
@use 'accessibility'
.switch
  @include accessibility.ring('.track')
`)

    expect(css).toBe(
      '.switch[data-focus-visible] .track,.switch:focus-visible .track{outline:var(--ring);outline-offset:var(--ring-offset)}'
    )
  })

  it('[a11y] rings a box while a field inside it has focus', () => {
    const css = compile(`
@use 'accessibility'
.search-box
  @include accessibility.ring-within
`)

    expect(css).toBe(
      '.search-box:has([data-focus-visible],:focus-visible){outline:var(--ring);outline-offset:var(--ring-offset)}'
    )
  })
})

describe('accessibility rings', () => {
  it('[a11y] moves one ring off --ring-offset', () => {
    const css = compile(`
@use 'accessibility'
.chip
  @include accessibility.ring($offset: 1px)
`)
    expect(css).toContain('outline-offset:1px')
  })

  it('[a11y] rings what takes focus by default, never a wrapper that mirrors it', () => {
    const css = compile(`
@use 'accessibility'
@layer base
  @include accessibility.ring-focusables
`)
    expect(css).toContain(
      ':where(a[href],button,input,select,textarea,summary,[tabindex],[contenteditable])[data-focus-visible]'
    )
    expect(css).not.toContain('*')
  })
})

describe('sizes', () => {
  const compileSize = (call: string) =>
    compile(`
@use 'sizes'
.a
  font-size: ${call}
`)

  it('[sizes] grows from min to max between 20rem and 80rem', () => {
    expect(compileSize('sizes.fluid(2rem, 3.5rem)')).toBe(
      '.a{font-size:clamp(2rem,1.5rem + 2.5vw,3.5rem)}'
    )
  })

  it('[sizes] takes another range of viewports', () => {
    expect(compileSize('sizes.fluid(1rem, 2rem, 30rem, 50rem)')).toBe(
      '.a{font-size:clamp(1rem,-0.5rem + 5vw,2rem)}'
    )
  })

  it.each([
    ['a px bound', 'sizes.fluid(14px, 2rem)'],
    ['a max past 2.5 times the min', 'sizes.fluid(1rem, 3rem)'],
    ['a max below the min', 'sizes.fluid(2rem, 1rem)']
  ])('[sizes] refuses %s', (_, call) => {
    expect(() => compileSize(call)).toThrow()
  })
})

describe('text-box', () => {
  it('[text-box] trims a one-line box and grows its padding by what the trim removed', () => {
    const css = compile(`
@use 'text-box'
.stamp
  @include text-box.trimmed-block(var(--space-s))
`)
    expect(css).toBe(
      '.stamp{padding-block:var(--space-s)}@supports(text-box: trim-both cap alphabetic){.stamp{padding-block:calc(var(--space-s) + (1lh - 1cap)/2);text-box:trim-both cap alphabetic}}'
    )
  })

  it('[text-box] trims a figure, with a line-height of 1 where text-box is missing', () => {
    const css = compile(`
@use 'text-box'
.score
  @include text-box.trimmed-figure
`)
    expect(css).toContain('.score{line-height:1}')
    expect(css).toContain('text-box:trim-both cap alphabetic')
  })
})

describe('spread', () => {
  const css = compile(`
@use 'spread'
.page
  @include spread.columns($gap: 12px)
`)

  it('[spread] stacks the columns ruled apart on a narrow screen', () => {
    expect(css).toContain(
      '.page .column+.column{border-top:var(--hairline);padding-top:var(--space-l)}'
    )
  })

  it('[spread] sets them side by side with the rule between on a wide one', () => {
    expect(css).toContain(
      '@media(width >= 56.25rem){.page .columns{gap:var(--space-2xl);grid-template-columns:1fr 1fr}'
    )
    expect(css).toContain('border-left:var(--hairline);border-top:0')
  })

  it('[spread] spaces a column’s own items by the gap it is given', () => {
    expect(css).toContain(
      '.page .column{display:flex;flex-direction:column;gap:12px;min-width:0}'
    )
  })
})
