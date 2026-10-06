import { describe, expect, it } from 'vitest'

import { parsePendingChange } from './pending-change.ts'

describe('parsePendingChange', () => {
  it('[pending-change] reads the bump and the summary of a changeset', () => {
    const changeset = [
      '---',
      '"@adrienlcp/react": minor',
      '---',
      '',
      'Add `Animate`, which keeps an element rendered with `data-exiting`.',
      ''
    ].join('\n')

    expect(parsePendingChange(changeset)).toEqual({
      data: {
        bumps: [{ bump: 'minor', packageName: '@adrienlcp/react' }],
        summary:
          'Add `Animate`, which keeps an element rendered with `data-exiting`.'
      },
      status: 'success'
    })
  })

  it('[pending-change] reads every package one changeset bumps', () => {
    const changeset = [
      '---',
      "'@adrienlcp/react': minor",
      '"@adrienlcp/react-aria": patch',
      '---',
      '',
      'Move `composeClassName`.'
    ].join('\n')

    const change = parsePendingChange(changeset)

    expect(change.status === 'success' && change.data.bumps).toEqual([
      { bump: 'minor', packageName: '@adrienlcp/react' },
      { bump: 'patch', packageName: '@adrienlcp/react-aria' }
    ])
  })

  it('[pending-change] leaves out a package the changeset does not release', () => {
    const changeset = [
      '---',
      '"@adrienlcp/react": minor',
      '"@adrienlcp/docs": none',
      '---',
      '',
      'Add a hook.'
    ].join('\n')

    const change = parsePendingChange(changeset)

    expect(change.status === 'success' && change.data.bumps).toEqual([
      { bump: 'minor', packageName: '@adrienlcp/react' }
    ])
  })

  it('[pending-change] reads an empty changeset as a change that bumps nothing', () => {
    expect(parsePendingChange('---\n---\n')).toEqual({
      data: { bumps: [], summary: '' },
      status: 'success'
    })
  })

  it.each([
    ['no front matter', 'Add a mixin.'],
    ['an unknown bump', '---\n"@adrienlcp/react": huge\n---\n\nAdd a mixin.'],
    ['a line with no bump', '---\n"@adrienlcp/react"\n---\n\nAdd a mixin.']
  ])('[pending-change] refuses a changeset with %s', (_case, changeset) => {
    expect(parsePendingChange(changeset)).toEqual({
      error: 'malformed',
      status: 'failure'
    })
  })
})
