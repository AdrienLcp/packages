import { execFileSync } from 'node:child_process'

import { Result } from '@adrienlcp/result'

/**
 * The day a version's heading entered a changelog: the oldest commit whose diff
 * adds `## <version>` to it, which the Version Packages pull request wrote on
 * release. Succeeds with `null` when no commit did.
 */
export const dayVersionEnteredChangelog = ({
  changelogPath,
  repositoryRoot,
  version
}: {
  changelogPath: string
  repositoryRoot: string
  version: string
}): Result<string | null, 'git_failed'> => {
  try {
    const days = execFileSync(
      'git',
      [
        'log',
        '--format=%ad',
        '--date=short',
        `-S## ${version}`,
        '--',
        changelogPath
      ],
      { cwd: repositoryRoot, encoding: 'utf8' }
    )
      .split('\n')
      .filter(Boolean)

    return Result.success(days.at(-1) ?? null)
  } catch {
    return Result.failure('git_failed')
  }
}
