import { fileURLToPath } from 'node:url'

import type { Result } from '@adrienlcp/result'
import { describe, expect, it } from 'vitest'

import { pageText, readDistText } from './dist-text.ts'
import { collapseWhiteSpace } from './measured-text.ts'

const DIST = fileURLToPath(new URL('test-texts/pages', import.meta.url))

const PAGE = `<!doctype html><html><head><title>Head</title></head><body>
<h1>Family <em>tree</em></h1><section class="lead"><p>Print <b class="lead">it</b></p></section>
<script>never()</script><noscript>Enable scripts</noscript></body></html>`

const shown = (text: Result<string, unknown>) =>
  text.status === 'success' ? collapseWhiteSpace(text.data) : text.error

describe('pageText', () => {
  it('[dist-text] reads the text a page shows, without its head, scripts and noscript', () => {
    expect(shown(pageText(PAGE))).toBe('Family tree Print it')
  })

  it('[dist-text] reads only the elements a selector matches, each once', () => {
    expect(shown(pageText(PAGE, 'h1'))).toBe('Family tree')
    expect(shown(pageText(PAGE, '.lead'))).toBe('Print it')
  })

  it('[dist-text] refuses a selector it cannot parse', () => {
    expect(pageText(PAGE, 'h1[')).toEqual({
      error: 'bad-selector',
      status: 'failure'
    })
  })
})

describe('readDistText', () => {
  it('[dist-text] reads every page under a directory', () => {
    expect(shown(readDistText(DIST))).toBe('About Family tree Print the sheet')
    expect(shown(readDistText(DIST, 'h1, h2'))).toBe('About Family tree')
  })

  it('[dist-text] fails on a directory without pages', () => {
    expect(
      readDistText(fileURLToPath(new URL('test-fonts', import.meta.url)))
    ).toEqual({ error: 'no-html', status: 'failure' })
  })
})
