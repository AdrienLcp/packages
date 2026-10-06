import { lexer, type Token, type Tokens } from 'marked'

import { isVersionBump, type VersionBump } from './version-bump.ts'

export type ChangelogNote = {
  bump: VersionBump
  /** The short hash changesets prefixes a note with; `null` on the notes it writes itself, such as updated dependencies. */
  commit: string | null
  /** Markdown, as written in the changeset. */
  text: string
}

export type ChangelogRelease = {
  notes: readonly ChangelogNote[]
  version: string
}

const RELEASE_DEPTH = 2
const BUMP_DEPTH = 3
const BUMP_HEADING = /^(Major|Minor|Patch) Changes$/
const COMMIT_PREFIX = /^([0-9a-f]{7,40}): /

const isHeadingOf = (token: Token, depth: number): token is Tokens.Heading =>
  token.type === 'heading' && token.depth === depth

const bumpOfHeading = (heading: Tokens.Heading): VersionBump | null => {
  const bump = BUMP_HEADING.exec(heading.text)?.[1]?.toLowerCase() ?? null

  return bump !== null && isVersionBump(bump) ? bump : null
}

const noteOf = (bump: VersionBump, item: Tokens.ListItem): ChangelogNote => {
  const commit = COMMIT_PREFIX.exec(item.text)?.[1] ?? null
  const text = commit === null ? item.text : item.text.slice(commit.length + 2)

  return { bump, commit, text: text.trim() }
}

/**
 * Reads a CHANGELOG.md written by changesets: one release per `## x.y.z`, newest
 * first as the file has them, each note under the bump heading it was filed in.
 */
export const parseReleaseNotes = (
  changelog: string
): readonly ChangelogRelease[] => {
  const releases: { notes: ChangelogNote[]; version: string }[] = []
  let bump: VersionBump | null = null

  for (const token of lexer(changelog)) {
    if (isHeadingOf(token, RELEASE_DEPTH)) {
      releases.push({ notes: [], version: token.text.trim() })
      bump = null
    } else if (isHeadingOf(token, BUMP_DEPTH)) {
      bump = bumpOfHeading(token)
    } else if (token.type === 'list' && bump !== null) {
      const listBump = bump
      releases
        .at(-1)
        ?.notes.push(
          ...token.items.map((item: Tokens.ListItem) => noteOf(listBump, item))
        )
    }
  }

  return releases
}
