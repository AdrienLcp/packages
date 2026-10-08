import { describe, expect, it } from 'vitest'

import { parseShell, SHELL_HTML } from '../shell.fixture.ts'
import { shellHead, shellHeadTransform } from './shell-head-plugin.ts'

describe('shell head', () => {
  it('runs before Vite injects its own tags', () => {
    expect(shellHead({}).transformIndexHtml).toMatchObject({ order: 'pre' })
  })

  it('writes the title and metaContents into every page by default', () => {
    const transform = shellHeadTransform({
      metaContents: { 'name="description"': 'Home page' },
      title: 'Home'
    })
    const document = parseShell(
      transform(SHELL_HTML, { filename: '/app/other.html' })
    )

    expect(document.title).toBe('Home')
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
    ).toBe('Home page')
  })

  it('keeps the title and leaves other files alone when given a filename', () => {
    const transform = shellHeadTransform({
      filename: '/app/index.html',
      metaContents: { 'name="description"': 'Home page' }
    })

    expect(transform(SHELL_HTML, { filename: '/app/cv.html' })).toBe(SHELL_HTML)
    expect(
      parseShell(transform(SHELL_HTML, { filename: '/app/index.html' })).title
    ).toBe('Shell')
  })
})
