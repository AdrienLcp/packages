import { Result } from '@adrienlcp/result'

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

const CHANGESET = /^---\r?\n([\s\S]*?)\r?\n?---[ \t]*(?:\r?\n|$)([\s\S]*)$/
const BUMP_LINE = /^\s*["']?([^"':\s]+)["']?\s*:\s*(\S+)\s*$/
const LINE_BREAK = /\r?\n/

const bumpOfLine = (line: string): Result<PendingBump, 'malformed'> => {
  const [, packageName, bump] = BUMP_LINE.exec(line) ?? []

  return packageName !== undefined && bump !== undefined && isVersionBump(bump)
    ? Result.success({ bump, packageName })
    : Result.failure('malformed')
}

/** Reads one `.changeset/*.md` file: its front matter of bumps, then its summary. */
export const parsePendingChange = (
  changeset: string
): Result<PendingChange, 'malformed'> => {
  const [, frontMatter, summary] = CHANGESET.exec(changeset) ?? []

  if (frontMatter === undefined || summary === undefined) {
    return Result.failure('malformed')
  }

  const bumps: PendingBump[] = []

  for (const line of frontMatter.split(LINE_BREAK)) {
    if (line.trim() === '') {
      continue
    }

    const bump = bumpOfLine(line)

    if (bump.status === 'failure') {
      return bump
    }

    bumps.push(bump.data)
  }

  return Result.success({ bumps, summary: summary.trim() })
}
