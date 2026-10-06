import GithubSlugger from 'github-slugger'
import { lexer, type Token } from 'marked'

/** A part of a Markdown document, cut at its `##` and `###` headings. */
export type MarkdownSection = {
  /** Its body, without the heading. */
  markdown: string
  /** Unique in the document, so it can be a fragment. */
  slug: string
  /** Markdown; `null` for the text before the first heading. */
  title: string | null
}

/** Hands out the anchors of one page, numbering a repeated one `-1`, `-2`… as GitHub does. */
export type HeadingSlugger = { slug: (text: string) => string }

/** Anchors GitHub would give the headings, so a link copied from either lands the same. */
export const createHeadingSlugger = (): HeadingSlugger => new GithubSlugger()

const DOCUMENT_TITLE_DEPTH = 1
const SECTION_DEPTHS: readonly number[] = [2, 3]

type SectionDraft = { tokens: Token[]; title: string | null }

const isSectionHeading = (token: Token): token is Token & { text: string } =>
  token.type === 'heading' && SECTION_DEPTHS.includes(token.depth)

const isDocumentTitle = (token: Token): boolean =>
  token.type === 'heading' && token.depth === DOCUMENT_TITLE_DEPTH

const toSection = ({
  tokens,
  title
}: SectionDraft): Omit<MarkdownSection, 'slug'> => ({
  markdown: tokens
    .map(({ raw }) => raw)
    .join('')
    .trim(),
  title
})

/**
 * Cuts a document at its `##` and `###` headings. Its `#` title is dropped:
 * the page names the package already. The text before the first heading is a
 * section of its own, under `openingSlug`, when it holds any.
 */
export const sectionsOf = ({
  document,
  openingSlug,
  slugger = createHeadingSlugger()
}: {
  document: string
  openingSlug: string
  /** Shared by every document of a page, so their anchors stay unique. */
  slugger?: HeadingSlugger
}): readonly MarkdownSection[] => {
  const drafts: SectionDraft[] = [{ title: null, tokens: [] }]

  for (const token of lexer(document)) {
    if (isSectionHeading(token)) {
      drafts.push({ title: token.text, tokens: [] })
    } else if (!isDocumentTitle(token)) {
      drafts.at(-1)?.tokens.push(token)
    }
  }

  return drafts
    .map(toSection)
    .filter((section) => section.title !== null || section.markdown !== '')
    .map((section) => ({
      ...section,
      slug: slugger.slug(section.title ?? openingSlug)
    }))
}
