import { execFileSync } from 'node:child_process'

import { Result } from '@adrienlcp/result'

/** The day each version's heading entered a package's changelog, by package directory then version. */
export type ReleaseDays = ReadonlyMap<string, ReadonlyMap<string, string>>

const COMMIT_DAY_MARK = 'commit-day '
const CHANGELOG_FILE_HEADER = /^\+\+\+ b\/packages\/([^/]+)\/CHANGELOG\.md$/
const ADDED_VERSION_HEADING = /^\+## (\S+)$/

/**
 * Reads `git log --patch` over every changelog, newest commit first: a
 * version's day is the oldest commit whose diff adds its `## <version>`
 * heading, which the Version Packages pull request wrote on release.
 */
export const releaseDaysIn = (log: string): ReleaseDays => {
  const days = new Map<string, Map<string, string>>()
  let day: string | null = null
  let directory: string | null = null

  for (const line of log.split('\n')) {
    if (line.startsWith(COMMIT_DAY_MARK)) {
      day = line.slice(COMMIT_DAY_MARK.length).trim()
      directory = null
      continue
    }

    const file = CHANGELOG_FILE_HEADER.exec(line)

    if (file !== null) {
      directory = file[1] ?? null
      continue
    }

    const version = ADDED_VERSION_HEADING.exec(line)?.[1]

    if (version === undefined || day === null || directory === null) {
      continue
    }

    const versions = days.get(directory) ?? new Map<string, string>()
    versions.set(version, day)
    days.set(directory, versions)
  }

  return days
}

/** Every changelog's release days, from one `git log` over the repository. */
export const readReleaseDays = (
  repositoryRoot: string
): Result<ReleaseDays, 'git_failed'> => {
  try {
    const log = execFileSync(
      'git',
      [
        'log',
        `--format=${COMMIT_DAY_MARK}%ad`,
        '--date=short',
        '--patch',
        '--unified=0',
        '--no-color',
        '--',
        'packages/*/CHANGELOG.md'
      ],
      { cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
    )

    return Result.success(releaseDaysIn(log))
  } catch {
    return Result.failure('git_failed')
  }
}
