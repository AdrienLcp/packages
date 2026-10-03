import { describe, expect, it } from 'vitest'

import { explainingSectionOf } from './export-sections.ts'
import type { MarkdownSection } from './markdown-sections.ts'

const sectionOf = (
  slug: string,
  title: string | null,
  markdown: string
): MarkdownSection => ({ markdown, slug, title })

describe('explainingSectionOf', () => {
  it('[export-sections] finds the section that names the export', () => {
    const sections = [
      sectionOf('install', 'Install', 'Run pnpm add.'),
      sectionOf('parsing', 'Parsing', 'Call `parse` with a string.')
    ]

    expect(explainingSectionOf({ sections, terms: ['parse'] })?.slug).toBe(
      'parsing'
    )
  })

  it('[export-sections] answers null when no section names the export', () => {
    const sections = [sectionOf('install', 'Install', 'Run pnpm add.')]

    expect(explainingSectionOf({ sections, terms: ['parse'] })).toBeNull()
  })

  it('[export-sections] prefers a titled section to the opening text, however often the opening names it', () => {
    const sections = [
      sectionOf('readme', null, 'parse parse parse parse'),
      sectionOf('usage', 'Usage', 'Call parse once.')
    ]

    expect(explainingSectionOf({ sections, terms: ['parse'] })?.slug).toBe(
      'usage'
    )
  })

  it('[export-sections] falls back to the opening text when only it names the export', () => {
    const sections = [
      sectionOf('readme', null, 'This is `parse`.'),
      sectionOf('usage', 'Usage', 'Nothing here.')
    ]

    expect(explainingSectionOf({ sections, terms: ['parse'] })?.slug).toBe(
      'readme'
    )
  })

  it('[export-sections] prefers the section that names the export most', () => {
    const sections = [
      sectionOf('a', 'A', 'parse once.'),
      sectionOf('b', 'B', 'parse, then parse again.')
    ]

    expect(explainingSectionOf({ sections, terms: ['parse'] })?.slug).toBe('b')
  })

  it('[export-sections] weighs a mention in the heading above any number in passing', () => {
    const sections = [
      sectionOf('a', 'Overview', 'parse parse parse parse parse'),
      sectionOf('b', 'parse', 'Does things.')
    ]

    expect(explainingSectionOf({ sections, terms: ['parse'] })?.slug).toBe('b')
  })

  it('[export-sections] takes the earliest section on a tie', () => {
    const sections = [
      sectionOf('first', 'First', 'parse once.'),
      sectionOf('second', 'Second', 'parse once.')
    ]

    expect(explainingSectionOf({ sections, terms: ['parse'] })?.slug).toBe(
      'first'
    )
  })

  it('[export-sections] counts mentions of any of the terms', () => {
    const sections = [
      sectionOf('a', 'A', 'See biome.json once.'),
      sectionOf('b', 'B', 'Extend @adrienlcp/config/biome.json, or biome.json.')
    ]

    expect(
      explainingSectionOf({
        sections,
        terms: ['@adrienlcp/config/biome.json', 'biome.json']
      })?.slug
    ).toBe('b')
  })

  it('[export-sections] does not take a longer name for the export', () => {
    const sections = [
      sectionOf('a', 'A', 'Call `parseAll` or `use-parse` or `$parse`.'),
      sectionOf('b', 'B', 'Call `parse`.')
    ]

    expect(explainingSectionOf({ sections, terms: ['parse'] })?.slug).toBe('b')
  })

  it('[export-sections] reads regex characters in a name literally', () => {
    const sections = [
      sectionOf('a', 'A', 'Call `$gutter`.'),
      sectionOf('b', 'B', 'Nothing.')
    ]

    expect(explainingSectionOf({ sections, terms: ['$gutter'] })?.slug).toBe(
      'a'
    )
  })

  it('[export-sections] gives back the section it was given, extra fields included', () => {
    const section = { ...sectionOf('a', 'A', 'parse'), file: 'README.md' }

    expect(
      explainingSectionOf({ sections: [section], terms: ['parse'] })?.file
    ).toBe('README.md')
  })
})
