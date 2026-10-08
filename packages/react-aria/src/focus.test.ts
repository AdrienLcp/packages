import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createElement } from 'react'
import { Checkbox, Switch } from 'react-aria-components'
import { renderToString } from 'react-dom/server'
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

describe('the package manifest', () => {
  it('[manifest] points the focus export at a file that ships', () => {
    expect(
      existsSync(
        new URL(`../${manifest.exports['./focus'].sass}`, import.meta.url)
      )
    ).toBe(true)
  })
})

describe('focus', () => {
  it('[focus] rings both the react-aria and the native focus-visible', () => {
    const css = compile(`
@use 'focus' with ($ring-color: var(--focus), $ring-width: 3px)
.a
  @include focus.ring
`)
    expect(css).toBe(
      '.a[data-focus-visible],.a:focus-visible{outline:3px solid var(--focus);outline-offset:3px}'
    )
  })

  it('[focus] draws the inset ring inside the box by its own width', () => {
    const css = compile(`
@use 'focus' with ($ring-width: 3px)
.a
  @include focus.ring-inset
`)
    expect(css).toContain('outline-offset:-3px')
  })

  it('[focus] takes another offset through configuration', () => {
    const css = compile(`
@use 'focus' with ($ring-offset: 1px)
.a
  @include focus.ring
`)
    expect(css).toContain('outline-offset:1px')
  })

  it('[focus] rings a descendant of the focused element', () => {
    const css = compile(`
@use 'focus'
.switch
  @include focus.ring-inset('.track')
`)
    expect(css).toBe(
      '.switch[data-focus-visible] .track,.switch:focus-visible .track{outline:2px solid currentColor;outline-offset:-2px}'
    )
  })

  it('[focus] rings a box while a field inside it has focus', () => {
    const css = compile(`
@use 'focus'
.search-box
  @include focus.ring-within
`)
    expect(css).toBe(
      '.search-box:has([data-focus-visible],:focus-visible){outline:2px solid currentColor;outline-offset:3px}'
    )
  })

  it('[focus] moves one ring off the configured offset', () => {
    const css = compile(`
@use 'focus'
.chip
  @include focus.ring($offset: 1px)
.search
  @include focus.ring-within($offset: 0)
`)
    expect(css).toContain(
      '.chip:focus-visible{outline:2px solid currentColor;outline-offset:1px}'
    )
    expect(css).toContain('outline-offset:0}')
  })

  it('[focus] rings what takes focus by default, never a wrapper that mirrors it', () => {
    const css = compile(`
@use 'focus'
@layer base
  @include focus.ring-focusables
`)
    expect(css).toContain(
      ':where(a[href],button,input,select,textarea,summary,[tabindex],[contenteditable])'
    )
    expect(css).not.toMatch(/[{,]\*/)
    expect(css).not.toContain('role')
  })

  it('[focus] skips the input react-aria hides under a switch or a checkbox', () => {
    const css = compile(`
@use 'focus'
@layer base
  @include focus.ring-focusables
`)
    expect(css).toContain(
      ':where(:not([style*="inset(50%)"],[style*="inset(50%)"] *))[data-focus-visible]'
    )
    expect(css).toContain(
      ':where(:not([style*="inset(50%)"],[style*="inset(50%)"] *)):focus-visible'
    )
  })

  it.each([
    ['Switch', createElement(Switch, null, 'Sound')],
    ['Checkbox', createElement(Checkbox, null, 'Sound')]
  ])(
    '[focus] finds the clip it skips around the input of a %s',
    (_, control) => {
      expect(renderToString(control)).toMatch(
        /<span style="[^"]*inset\(50%\)[^"]*"><input/
      )
    }
  )
})
