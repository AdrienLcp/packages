import { describe, expect, it } from 'vitest'

import {
  buildCatalogue,
  type CatalogueSources,
  type MarkdownRendering,
  type PackageSources
} from './catalogue.ts'
import type { PendingChange } from './pending-change.ts'

const render: MarkdownRendering = {
  block: (markdown) => `<p>${markdown}</p>`,
  inline: (markdown) => markdown
}

const sourcesOf = (
  directory: string,
  overrides: Partial<PackageSources> = {}
): PackageSources => ({
  changelog: null,
  directory,
  documents: [{ file: 'README.md', markdown: `# @adrienlcp/${directory}` }],
  manifest: {
    dependencies: [],
    description: `The ${directory} package`,
    exports: { '.': './dist/index.js' },
    keywords: [],
    name: `@adrienlcp/${directory}`,
    optionalPeers: [],
    peers: [],
    version: '0.1.0'
  },
  readSource: () => null,
  ...overrides
})

const catalogueOf = (
  packages: readonly PackageSources[],
  overrides: Partial<CatalogueSources> = {}
) =>
  buildCatalogue({
    linkBaseOf: (directory) => `https://example.test/${directory}`,
    packages,
    pendingChanges: [],
    releaseDateOf: () => null,
    render,
    ...overrides
  })

const releaseNotes = (version: string, note: string): string =>
  `## ${version}\n### Patch Changes\n- be261dc: ${note}`

describe('buildCatalogue', () => {
  it('[catalogue] gives each package only the pending changes that bump it', () => {
    const forReact: PendingChange = {
      bumps: [{ bump: 'minor', packageName: '@adrienlcp/react' }],
      summary: 'Add `Animate`.'
    }
    const forBoth: PendingChange = {
      bumps: [
        { bump: 'patch', packageName: '@adrienlcp/react' },
        { bump: 'patch', packageName: '@adrienlcp/styles' }
      ],
      summary: 'Still view transitions.'
    }

    const { packages } = catalogueOf(
      [sourcesOf('react'), sourcesOf('styles')],
      { pendingChanges: [forReact, forBoth] }
    )

    expect(packages.find(({ name }) => name === 'react')?.pending).toEqual([
      { bump: 'minor', html: '<p>Add `Animate`.</p>' },
      { bump: 'patch', html: '<p>Still view transitions.</p>' }
    ])
    expect(packages.find(({ name }) => name === 'styles')?.pending).toEqual([
      { bump: 'patch', html: '<p>Still view transitions.</p>' }
    ])
  })

  it('[catalogue] shows one hand version for a package published by hand, with no changelog', () => {
    const { packages } = catalogueOf([sourcesOf('result')])

    expect(packages[0]?.versions).toEqual([
      { origin: 'hand', version: '0.1.0' }
    ])
  })

  it('[catalogue] reads the releases of a package from its changelog, with their date and largest bump', () => {
    const changelog = [
      '## 0.2.0',
      '### Minor Changes',
      '- aaaaaaa: Add `parse`.',
      '### Patch Changes',
      '- bbbbbbb: Fix a typo.'
    ].join('\n')

    const { packages } = catalogueOf([sourcesOf('i18n', { changelog })], {
      releaseDateOf: ({ directory, version }) =>
        directory === 'i18n' && version === '0.2.0' ? '2026-03-04' : null
    })

    expect(packages[0]?.versions).toEqual([
      {
        bump: 'minor',
        date: '2026-03-04',
        notes: [
          { bump: 'minor', commit: 'aaaaaaa', html: '<p>Add `parse`.</p>' },
          { bump: 'patch', commit: 'bbbbbbb', html: '<p>Fix a typo.</p>' }
        ],
        origin: 'changelog',
        version: '0.2.0'
      }
    ])
  })

  it('[catalogue] lists the packages with the newest release first, undated ones last by name', () => {
    const releasedOn = new Map([
      ['browser', '2026-01-10'],
      ['react', '2026-03-01'],
      ['styles', '2026-02-01']
    ])

    const { packages } = catalogueOf(
      [
        sourcesOf('styles', { changelog: releaseNotes('0.1.1', 'Fix.') }),
        sourcesOf('result'),
        sourcesOf('browser', { changelog: releaseNotes('0.1.1', 'Fix.') }),
        sourcesOf('i18n'),
        sourcesOf('react', { changelog: releaseNotes('0.1.1', 'Fix.') })
      ],
      { releaseDateOf: ({ directory }) => releasedOn.get(directory) ?? null }
    )

    expect(packages.map(({ name }) => name)).toEqual([
      'react',
      'styles',
      'browser',
      'i18n',
      'result'
    ])
  })

  it('[catalogue] lists the releases of a package newest first, as its changelog does', () => {
    const changelog = [
      releaseNotes('0.2.0', 'Second.'),
      releaseNotes('0.1.1', 'First.')
    ].join('\n\n')

    const { packages } = catalogueOf([sourcesOf('i18n', { changelog })])

    expect(packages[0]?.versions.map(({ version }) => version)).toEqual([
      '0.2.0',
      '0.1.1'
    ])
  })

  it.each([
    ['0.1.1', '0.1.1'],
    ['0.1.0', null]
  ])(
    '[catalogue] marks versions before %s as published by hand: %s',
    (oldestRelease, handPublishedBefore) => {
      const changelog = [
        releaseNotes('0.3.0', 'Latest.'),
        releaseNotes(oldestRelease, 'Oldest.')
      ].join('\n\n')

      const { packages } = catalogueOf([sourcesOf('i18n', { changelog })])

      expect(packages[0]?.handPublishedBefore).toBe(handPublishedBefore)
    }
  )

  it('[catalogue] marks no version as published by hand for a package with no changelog', () => {
    expect(
      catalogueOf([sourcesOf('result')]).packages[0]?.handPublishedBefore
    ).toBeNull()
  })

  it('[catalogue] installs a package that holds only JSON files as a dev dependency', () => {
    const { packages } = catalogueOf([
      sourcesOf('biome-config', {
        manifest: {
          ...sourcesOf('biome-config').manifest,
          exports: {
            './biome.json': './biome.json',
            './package.json': './package.json'
          }
        }
      })
    ])

    expect(packages[0]?.install).toBe('pnpm add -D @adrienlcp/biome-config')
  })

  it('[catalogue] installs a package that holds code as a dependency', () => {
    const { packages } = catalogueOf([sourcesOf('result')])

    expect(packages[0]?.install).toBe('pnpm add @adrienlcp/result')
  })

  it('[catalogue] locates each export in the README section that explains it', () => {
    const readme = [
      '# @adrienlcp/result',
      '',
      '## Creating things',
      '',
      '`createThing` builds one.',
      '',
      '## Install',
      '',
      'Run pnpm.'
    ].join('\n')
    const files = new Map([
      [
        'src/index.ts',
        '/** Builds a thing. Slowly. */\nexport const createThing = () => 1'
      ]
    ])

    const { packages } = catalogueOf([
      sourcesOf('result', {
        documents: [{ file: 'README.md', markdown: readme }],
        readSource: (path) => files.get(path) ?? null
      })
    ])

    expect(packages[0]?.exports).toEqual([
      {
        kind: 'function',
        name: 'createThing',
        section: {
          file: 'README.md',
          slug: 'creating-things',
          titleHtml: 'Creating things'
        },
        specifier: '@adrienlcp/result',
        summaryHtml: 'Builds a thing.'
      }
    ])
  })

  it('[catalogue] renders the documentation of each package apart, under the name of the package', () => {
    const { documents } = catalogueOf([
      sourcesOf('result', {
        documents: [
          {
            file: 'README.md',
            markdown: '# Title\n\nOpening.\n\n## Install\n\nRun pnpm.'
          }
        ]
      })
    ])

    expect(documents).toEqual({
      result: [
        {
          file: 'README.md',
          html: '<p>Opening.</p>',
          slug: 'readme',
          titleHtml: null
        },
        {
          file: 'README.md',
          html: '<p>Run pnpm.</p>',
          slug: 'install',
          titleHtml: 'Install'
        }
      ]
    })
  })

  it('[catalogue] names the house packages a package depends on without their scope, and the others apart', () => {
    const { packages } = catalogueOf([
      sourcesOf('safe-storage', {
        manifest: {
          ...sourcesOf('safe-storage').manifest,
          dependencies: ['@adrienlcp/result', 'zod']
        }
      })
    ])

    expect(packages[0]?.dependsOn).toEqual(['result'])
    expect(packages[0]?.dependsOnElsewhere).toEqual(['zod'])
  })
})
