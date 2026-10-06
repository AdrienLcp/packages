import { Result } from '@adrienlcp/result'
import { parseChangesetFile } from '@changesets/parse'

import { isVersionBump, type VersionBump } from './version-bump.ts'

export type PendingBump = {
  bump: VersionBump
  /** The package's scoped name, `@adrienlcp/i18n`. */
  packageName: string
}

/** A changeset merged on `main` and not released yet. */
export type PendingChange = {
  bumps: readonly PendingBump[]
  /** Markdown: the note the next release will carry. */
  summary: string
}

type ParsedChangeset = ReturnType<typeof parseChangesetFile>

const readChangeset = (
  changeset: string
): Result<ParsedChangeset, 'malformed'> => {
  try {
    return Result.success(parseChangesetFile(changeset))
  } catch {
    return Result.failure('malformed')
  }
}

/**
 * Reads one `.changeset/*.md` file: its front matter of bumps, then its
 * summary. A package the changeset marks `none` is left out: it is not
 * released.
 */
export const parsePendingChange = (
  changeset: string
): Result<PendingChange, 'malformed'> => {
  const parsed = readChangeset(changeset)

  if (parsed.status === 'failure') {
    return parsed
  }

  const bumps = parsed.data.releases.flatMap(({ name, type }) =>
    isVersionBump(type) ? [{ bump: type, packageName: name }] : []
  )

  return Result.success({ bumps, summary: parsed.data.summary })
}
