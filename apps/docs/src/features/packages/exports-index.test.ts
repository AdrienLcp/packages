import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import type { PackageSources } from './catalogue.ts'
import { EXPORTS_INDEX_COMMAND, exportsIndexOf } from './exports-index.ts'
import { packageSourcesIn } from './package-sources.ts'

const resultPackage: PackageSources = {
  changelog: null,
  directory: 'result',
  documents: [
    {
      file: 'README.md',
      markdown: '# @adrienlcp/result\n\n## Creating things\n\n`createThing()`'
    }
  ],
  manifest: {
    commands: [],
    dependencies: [],
    description: 'Results without throwing',
    exports: { '.': './dist/index.js' },
    keywords: [],
    name: '@adrienlcp/result',
    optionalPeers: [],
    peers: [],
    version: '0.1.0'
  },
  readSource: (path) =>
    path === 'src/index.ts'
      ? '/** Builds a thing. Slowly. */\nexport const createThing = () => 1\nexport type Thing = number'
      : null
}

/** Every package's exports run through the TypeScript compiler, 120-odd files: about a second alone under coverage, past five beside another build's tests. */
const COMPILE_EVERY_PACKAGE_TIMEOUT_MS = 30_000

describe('exportsIndexOf', () => {
  it('[exports-index] lists each export under its entry point, with its summary and the section that shows it', () => {
    expect(exportsIndexOf([resultPackage])).toBe(
      [
        '# @adrienlcp exports',
        '',
        `Every name the packages export, read from their entry points. Written by \`${EXPORTS_INDEX_COMMAND}\`; do not edit by hand.`,
        '',
        'Look here before writing a helper, a mixin or a hook: when one already does the job, import it.',
        '',
        '## @adrienlcp/result',
        '',
        'Results without throwing',
        '',
        '### `@adrienlcp/result`',
        '',
        '- `createThing` (function) — Builds a thing. [More](https://github.com/AdrienLcp/packages/blob/main/packages/result/README.md#creating-things)',
        '- `Thing` (type)',
        ''
      ].join('\n')
    )
  })

  it('[exports-index] EXPORTS.md matches what the packages export', {
    timeout: COMPILE_EVERY_PACKAGE_TIMEOUT_MS
  }, () => {
    const repositoryRoot = resolve(import.meta.dirname, '../../../../..')
    const written = readFileSync(resolve(repositoryRoot, 'EXPORTS.md'), 'utf8')

    expect(
      written,
      `EXPORTS.md is out of date: run ${EXPORTS_INDEX_COMMAND}`
    ).toBe(
      exportsIndexOf(packageSourcesIn(resolve(repositoryRoot, 'packages')))
    )
  })
})
