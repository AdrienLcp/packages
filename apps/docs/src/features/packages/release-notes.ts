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

const LINE_BREAK = /\r?\n/
const RELEASE_HEADING = /^## (\S+)\s*$/
const BUMP_HEADING = /^### (Major|Minor|Patch) Changes\s*$/
const NOTE_START = /^- (?:([0-9a-f]{7,40}): )?(.*)$/
const NOTE_INDENT = '  '

type NoteDraft = {
  bump: VersionBump
  commit: string | null
  lines: string[]
}

const firstGroup = (pattern: RegExp, line: string): string | null =>
  pattern.exec(line)?.[1] ?? null

const bumpOfHeading = (line: string): VersionBump | null => {
  const heading = firstGroup(BUMP_HEADING, line)?.toLowerCase() ?? null

  return heading !== null && isVersionBump(heading) ? heading : null
}

const noteOf = ({ bump, commit, lines }: NoteDraft): ChangelogNote => ({
  bump,
  commit,
  text: lines.join('\n').trim()
})

/**
 * Reads a CHANGELOG.md written by changesets: one release per `## x.y.z`, newest
 * first as the file has them, each note under the bump heading it was filed in.
 */
export const parseReleaseNotes = (
  changelog: string
): readonly ChangelogRelease[] => {
  const releases: { notes: ChangelogNote[]; version: string }[] = []
  let bump: VersionBump | null = null
  let draft: NoteDraft | null = null

  const closeNote = (): void => {
    if (draft !== null) {
      releases.at(-1)?.notes.push(noteOf(draft))
      draft = null
    }
  }

  for (const line of changelog.split(LINE_BREAK)) {
    const version = firstGroup(RELEASE_HEADING, line)

    if (version !== null) {
      closeNote()
      releases.push({ notes: [], version })
      bump = null
      continue
    }

    const headingBump = bumpOfHeading(line)

    if (headingBump !== null) {
      closeNote()
      bump = headingBump
      continue
    }

    const noteStart = NOTE_START.exec(line)

    if (noteStart !== null && bump !== null) {
      closeNote()
      draft = {
        bump,
        commit: noteStart[1] ?? null,
        lines: [noteStart[2] ?? '']
      }
      continue
    }

    if (draft !== null && (line === '' || line.startsWith(NOTE_INDENT))) {
      draft.lines.push(line.slice(NOTE_INDENT.length))
    }
  }

  closeNote()

  return releases
}
