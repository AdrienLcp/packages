import { describe, expect, it } from 'vitest'

import { parseReleaseNotes } from './release-notes.ts'

const changelogOf = (lines: readonly string[]): string => lines.join('\n')

describe('parseReleaseNotes', () => {
  it('[release-notes] reads every release, newest first as the file lists them', () => {
    const changelog = changelogOf([
      '# @adrienlcp/i18n',
      '',
      '## 0.2.0',
      '',
      '### Minor Changes',
      '',
      '- e6ed7d1: `{x:date}` now also takes a `Temporal.Instant`.',
      '',
      '## 0.1.1',
      '',
      '### Patch Changes',
      '',
      '- be261dc: An invalid `Date` now leaves its placeholder standing.',
      ''
    ])

    expect(parseReleaseNotes(changelog)).toEqual([
      {
        notes: [
          {
            bump: 'minor',
            commit: 'e6ed7d1',
            text: '`{x:date}` now also takes a `Temporal.Instant`.'
          }
        ],
        version: '0.2.0'
      },
      {
        notes: [
          {
            bump: 'patch',
            commit: 'be261dc',
            text: 'An invalid `Date` now leaves its placeholder standing.'
          }
        ],
        version: '0.1.1'
      }
    ])
  })

  it('[release-notes] keeps a note written over several paragraphs whole, unindented', () => {
    const changelog = changelogOf([
      '## 0.1.1',
      '### Patch Changes',
      '- 152b3c0: `createI18n` refuses a union `defaultLocale`.',
      '',
      '  The `DictionaryFor` documentation now says it is for `createTranslator` only.',
      ''
    ])

    expect(parseReleaseNotes(changelog)[0]?.notes).toEqual([
      {
        bump: 'patch',
        commit: '152b3c0',
        text: '`createI18n` refuses a union `defaultLocale`.\n\nThe `DictionaryFor` documentation now says it is for `createTranslator` only.'
      }
    ])
  })

  it('[release-notes] files each note under the bump heading it sits in', () => {
    const changelog = changelogOf([
      '## 1.0.0',
      '### Major Changes',
      '- aaaaaaa: Drop the old entry point.',
      '### Minor Changes',
      '- bbbbbbb: Add a mixin.',
      '- ccccccc: Add another.',
      '### Patch Changes',
      '- ddddddd: Fix a typo.'
    ])

    expect(
      parseReleaseNotes(changelog)[0]?.notes.map((note) => note.bump)
    ).toEqual(['major', 'minor', 'minor', 'patch'])
  })

  it('[release-notes] keeps the updated dependencies note changesets writes, without a commit', () => {
    const changelog = changelogOf([
      '## 0.3.1',
      '### Patch Changes',
      '- Updated dependencies [183c6d8]',
      '  - @adrienlcp/safe-storage@0.1.1'
    ])

    expect(parseReleaseNotes(changelog)[0]?.notes).toEqual([
      {
        bump: 'patch',
        commit: null,
        text: 'Updated dependencies [183c6d8]\n- @adrienlcp/safe-storage@0.1.1'
      }
    ])
  })

  it('[release-notes] reads a file saved with Windows line endings', () => {
    const changelog =
      '## 0.1.0\r\n### Minor Changes\r\n- e92e6cc: First release\r\n'

    expect(parseReleaseNotes(changelog)).toEqual([
      {
        notes: [{ bump: 'minor', commit: 'e92e6cc', text: 'First release' }],
        version: '0.1.0'
      }
    ])
  })

  it('[release-notes] reads a changelog holding no release yet as none', () => {
    expect(parseReleaseNotes('# @adrienlcp/result\n')).toEqual([])
  })
})
