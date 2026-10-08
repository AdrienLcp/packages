import { describe, expect, it } from 'vitest'

import { releaseDaysIn } from './changelog-history.ts'

const log = [
  'commit-day 2026-10-08',
  '',
  'diff --git a/packages/styles/CHANGELOG.md b/packages/styles/CHANGELOG.md',
  '--- a/packages/styles/CHANGELOG.md',
  '+++ b/packages/styles/CHANGELOG.md',
  '@@ -2,0 +3,4 @@',
  '+## 0.12.0',
  '+++ b/packages/result/CHANGELOG.md',
  '+## 0.1.10',
  'commit-day 2026-09-01',
  '',
  '+++ b/packages/styles/CHANGELOG.md',
  '+## 0.11.0',
  '-## 0.10.0',
  'commit-day 2026-08-01',
  '',
  '+++ b/packages/styles/CHANGELOG.md',
  '+## 0.11.0',
  '+## 0.10.0'
].join('\n')

describe('releaseDaysIn', () => {
  it('[release-days] dates a version by the oldest commit that adds its heading', () => {
    expect(releaseDaysIn(log).get('styles')).toEqual(
      new Map([
        ['0.12.0', '2026-10-08'],
        ['0.11.0', '2026-08-01'],
        ['0.10.0', '2026-08-01']
      ])
    )
  })

  it('[release-days] keeps each changelog to its own package', () => {
    expect(releaseDaysIn(log).get('result')).toEqual(
      new Map([['0.1.10', '2026-10-08']])
    )
  })
})
