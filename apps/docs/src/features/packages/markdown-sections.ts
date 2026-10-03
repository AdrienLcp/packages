/** A part of a Markdown document, cut at its `##` and `###` headings. */
export type MarkdownSection = {
  /** Its body, without the heading. */
  markdown: string
  /** Unique in the document, so it can be a fragment. */
  slug: string
  /** Markdown; `null` for the text before the first heading. */
  title: string | null
}

const FENCE = /^\s*(```|~~~)/
const DOCUMENT_TITLE = /^#\s/
const SECTION_HEADING = /^#{2,3}\s+(.*?)(?:\s+#+)?\s*$/

/** The anchor GitHub gives a heading, so a link copied from either lands the same. */
export const headingSlugOf = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-')

type SectionDraft = { lines: string[]; title: string | null }

const toSection = ({
  lines,
  title
}: SectionDraft): Omit<MarkdownSection, 'slug'> => ({
  markdown: lines.join('\n').trim(),
  title
})

/** `-1`, `-2`… after a slug already taken, the way GitHub numbers repeated headings. */
const uniqueSlug = (slug: string, taken: Set<string>): string => {
  let candidate = slug

  for (let count = 1; taken.has(candidate); count++) {
    candidate = `${slug}-${count}`
  }

  taken.add(candidate)

  return candidate
}

/**
 * Cuts a document at its `##` and `###` headings, outside code fences. Its `#`
 * title is dropped: the page names the package already. The text before the
 * first heading is a section of its own, under `openingSlug`, when it holds any.
 */
export const sectionsOf = ({
  document,
  openingSlug,
  takenSlugs = new Set()
}: {
  document: string
  openingSlug: string
  /** Slugs other documents on the same page already use; filled in place. */
  takenSlugs?: Set<string>
}): readonly MarkdownSection[] => {
  const drafts: SectionDraft[] = [{ lines: [], title: null }]
  let isInsideFence = false

  for (const line of document.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      isInsideFence = !isInsideFence
    }

    const heading = isInsideFence ? null : SECTION_HEADING.exec(line)

    if (heading !== null) {
      drafts.push({ lines: [], title: heading[1] ?? '' })
    } else if (isInsideFence || !DOCUMENT_TITLE.test(line)) {
      drafts.at(-1)?.lines.push(line)
    }
  }

  return drafts
    .map(toSection)
    .filter((section) => section.title !== null || section.markdown !== '')
    .map((section) => ({
      ...section,
      slug: uniqueSlug(
        section.title === null ? openingSlug : headingSlugOf(section.title),
        takenSlugs
      )
    }))
}
