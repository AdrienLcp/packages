import { describe, expect, it } from 'vitest'

import { headingSlugOf, sectionsOf } from './markdown-sections.ts'

const lines = (...text: string[]): string => text.join('\n')

describe('headingSlugOf', () => {
  it.each([
    ['Getting started', 'getting-started'],
    ['Hello, World!', 'hello-world'],
    ['Use `render` now', 'use-render-now'],
    ['snake_case and kebab-case', 'snake_case-and-kebab-case'],
    ['Café au lait', 'café-au-lait']
  ])('[markdown-sections] gives %j the anchor %j', (title, slug) => {
    expect(headingSlugOf(title)).toBe(slug)
  })
})

describe('sectionsOf', () => {
  it('[markdown-sections] cuts a document at its ## and ### headings', () => {
    const document = lines(
      '# Title',
      '',
      'Intro text.',
      '',
      '## Install',
      '',
      'Run it.',
      '',
      '### Details',
      '',
      'More.'
    )

    expect(sectionsOf({ document, openingSlug: 'readme' })).toEqual([
      { markdown: 'Intro text.', slug: 'readme', title: null },
      { markdown: 'Run it.', slug: 'install', title: 'Install' },
      { markdown: 'More.', slug: 'details', title: 'Details' }
    ])
  })

  it('[markdown-sections] drops the # title, and makes no opening section when nothing else precedes the first heading', () => {
    const document = lines('# Title', '', '## Install', '', 'Run it.')

    expect(sectionsOf({ document, openingSlug: 'readme' })).toEqual([
      { markdown: 'Run it.', slug: 'install', title: 'Install' }
    ])
  })

  it('[markdown-sections] keeps a # the heading ends with, and drops a closing sequence after a space', () => {
    const document = lines('## C#', 'One.', '## Closed ##', 'Two.')

    expect(
      sectionsOf({ document, openingSlug: 'readme' }).map(({ title }) => title)
    ).toEqual(['C#', 'Closed'])
  })

  it('[markdown-sections] keeps a heading that has no body', () => {
    const document = lines('## Empty', '## Next', 'Text.')

    expect(
      sectionsOf({ document, openingSlug: 'readme' }).map(
        ({ markdown, title }) => [title, markdown]
      )
    ).toEqual([
      ['Empty', ''],
      ['Next', 'Text.']
    ])
  })

  it('[markdown-sections] does not cut at a heading inside a code fence, and keeps a # line there', () => {
    const document = lines(
      '## Real',
      '',
      '```sh',
      '# a comment',
      '## not a heading',
      '```',
      '',
      'After.'
    )

    expect(sectionsOf({ document, openingSlug: 'readme' })).toEqual([
      {
        markdown: lines(
          '```sh',
          '# a comment',
          '## not a heading',
          '```',
          '',
          'After.'
        ),
        slug: 'real',
        title: 'Real'
      }
    ])
  })

  it('[markdown-sections] reads headings again once the fence has closed', () => {
    const document = lines('~~~', '## inside', '~~~', '## Outside', 'Text.')

    expect(
      sectionsOf({ document, openingSlug: 'readme' }).map(({ title }) => title)
    ).toEqual([null, 'Outside'])
  })

  it('[markdown-sections] strips the closing hashes of a heading', () => {
    expect(
      sectionsOf({ document: '## Usage ##\nText.', openingSlug: 'readme' })[0]
        ?.title
    ).toBe('Usage')
  })

  it('[markdown-sections] numbers repeated headings -1, -2 the way GitHub does', () => {
    const document = lines('## Usage', 'a', '## Usage', 'b', '## Usage', 'c')

    expect(
      sectionsOf({ document, openingSlug: 'readme' }).map(({ slug }) => slug)
    ).toEqual(['usage', 'usage-1', 'usage-2'])
  })

  it('[markdown-sections] shares taken slugs between documents', () => {
    const takenSlugs = new Set<string>()

    const first = sectionsOf({
      document: lines('Opening.', '## Usage', 'a'),
      openingSlug: 'readme',
      takenSlugs
    })
    const second = sectionsOf({
      document: lines('Opening.', '## Usage', 'b'),
      openingSlug: 'readme',
      takenSlugs
    })

    expect(
      [first, second].map((sections) => sections.map(({ slug }) => slug))
    ).toEqual([
      ['readme', 'usage'],
      ['readme-1', 'usage-1']
    ])
    expect([...takenSlugs]).toEqual(['readme', 'usage', 'readme-1', 'usage-1'])
  })

  it('[markdown-sections] reads a document saved with Windows line endings', () => {
    const document =
      '# Title\r\n\r\nIntro.\r\n\r\n## Install\r\n\r\nRun it.\r\n'

    expect(
      sectionsOf({ document, openingSlug: 'readme' }).map(
        ({ markdown, title }) => [title, markdown]
      )
    ).toEqual([
      [null, 'Intro.'],
      ['Install', 'Run it.']
    ])
  })

  it('[markdown-sections] finds no section in an empty document', () => {
    expect(sectionsOf({ document: '', openingSlug: 'readme' })).toEqual([])
  })
})
